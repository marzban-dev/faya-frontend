// Usage:
//   video-tools decode <video> <out-dir>                 every frame as out-dir/0000.png, 0001.png, …
//   video-tools encode <png-dir> <out.mp4> <fps> <bps>   the PNGs in name order as an H.264 MP4
import AVFoundation
import AppKit

let args = CommandLine.arguments

func pngData(_ image: CGImage) -> Data {
    NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!
}

func decode(video: String, outDir: String) {
    let asset = AVURLAsset(url: URL(fileURLWithPath: video))
    let track = asset.tracks(withMediaType: .video).first!
    let reader = try! AVAssetReader(asset: asset)
    let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    ])
    reader.add(output)
    reader.startReading()

    let context = CIContext()
    var index = 0
    while let sample = output.copyNextSampleBuffer() {
        guard let buffer = CMSampleBufferGetImageBuffer(sample) else { continue }
        let image = CIImage(cvPixelBuffer: buffer)
        let frame = context.createCGImage(image, from: image.extent)!
        try! pngData(frame).write(to: URL(fileURLWithPath: String(format: "%@/%04d.png", outDir, index)))
        index += 1
    }
    print("\(index) frames at \(track.nominalFrameRate) fps")
}

func encode(pngDir: String, out: String, fps: Int32, bitsPerSecond: Int) {
    let files = try! FileManager.default.contentsOfDirectory(atPath: pngDir).filter { $0.hasSuffix(".png") }.sorted()
    let first = NSImage(contentsOfFile: "\(pngDir)/\(files[0])")!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
    let width = first.width
    let height = first.height

    let outURL = URL(fileURLWithPath: out)
    try? FileManager.default.removeItem(at: outURL)
    let writer = try! AVAssetWriter(outputURL: outURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true

    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: bitsPerSecond,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoMaxKeyFrameIntervalKey: Int(fps),
        ],
        AVVideoColorPropertiesKey: [
            AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
            AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
            AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
        ],
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
    ])
    writer.add(input)
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    for (index, file) in files.enumerated() {
        let image = NSImage(contentsOfFile: "\(pngDir)/\(file)")!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
        var buffer: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
        CVPixelBufferLockBaseAddress(buffer!, [])
        let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer!),
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer!),
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        )!
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        CVPixelBufferUnlockBaseAddress(buffer!, [])

        while !input.isReadyForMoreMediaData { usleep(1000) }
        adaptor.append(buffer!, withPresentationTime: CMTime(value: CMTimeValue(index), timescale: fps))
    }

    input.markAsFinished()
    let done = DispatchSemaphore(value: 0)
    writer.finishWriting { done.signal() }
    done.wait()
    if writer.status != .completed { fatalError("encode failed: \(String(describing: writer.error))") }
    print("\(files.count) frames → \(out)")
}

switch args.count > 1 ? args[1] : "" {
case "decode":
    decode(video: args[2], outDir: args[3])
case "encode":
    encode(pngDir: args[2], out: args[3], fps: Int32(args[4])!, bitsPerSecond: Int(args[5])!)
default:
    fatalError("usage: video-tools decode <video> <out-dir> | encode <png-dir> <out.mp4> <fps> <bps>")
}
