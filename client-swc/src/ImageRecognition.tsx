import { FormEvent, useState } from 'react'
import './ImageRecognition.css'
import { FLASK_API_URL } from './utils/config'

const ImageRecognition = () => {
  const [image, setImage] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState<string | ArrayBuffer>('')
  const [recognizedTags, setRecognizedTags] = useState<string[]>([])

  const handleImageChange = (e: FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement
    const file = input?.files ? input.files[0] : null
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImgSrc(reader.result ?? '')
        setImage(file)
        setRecognizedTags([])
      }
      reader.readAsDataURL(file)
    }
  }

  const recognizeImage = async () => {
    if (image) {
      const formData = new FormData()
      formData.append('image', image)

      try {
        const response = await fetch(`${FLASK_API_URL}/recognize-image`, {
          method: 'POST',
          body: formData,
        }).then((r) => r.json())
        const tags = response.map((pred: { tag: string }) => pred.tag) // Extract tags
        setRecognizedTags(tags)
      } catch (error) {
        console.error('Error recognizing image:', error)
      }
    }
  }

  return (
    <section className='recognition-section'>
      <input type='file' accept='image/*' onChange={handleImageChange} />
      {imgSrc && (
        <div className='card'>
          <div className='image-container'>
            <img src={imgSrc as string} alt='Uploaded' width='300' />
          </div>
          <div>
            <button onClick={recognizeImage}>Recognize Image</button>
            {recognizedTags.length > 0 && (
              <>
                <h2>Tags:</h2>
                <p>{recognizedTags.join(', ')}</p>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default ImageRecognition
