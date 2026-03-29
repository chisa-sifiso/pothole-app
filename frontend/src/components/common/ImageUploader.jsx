import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image } from 'lucide-react'

export default function ImageUploader({ onFileSelect, label = 'Upload Image' }) {
  const [preview, setPreview] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFileSelect(file)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const clear = () => {
    setPreview(null)
    onFileSelect(null)
  }

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-gray-500">
            {isDragActive ? (
              <>
                <Image className="w-8 h-8 text-blue-500" />
                <p className="text-sm text-blue-600">Drop the image here</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <p className="text-sm">Drag & drop an image, or <span className="text-blue-600 font-medium">browse</span></p>
                <p className="text-xs text-gray-400">JPEG, PNG, WebP up to 10MB</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
