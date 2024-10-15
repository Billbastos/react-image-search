import { FormEvent, useState } from 'react'
import './ImageUploader.css'

const SERVER_URL = 'http://localhost:5000'
const ImageUploader = ({
  setRecognizedTags,
}: {
  setRecognizedTags: (tags: string[]) => void
}) => {
  const [image, setImage] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState<string | ArrayBuffer>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isQueryInitialized, setQueryInitialized] = useState(false)

  const handleImageChange = (e: FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement
    const file = input?.files ? input.files[0] : null
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImgSrc(reader.result ?? '')
        setImage(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const recognizeImage = async () => {
    if (image) {
      const formData = new FormData()
      formData.append('image', image)

      try {
        const response = await fetch(`${SERVER_URL}/recognize-image`, {
          method: 'POST',
          body: formData,
        }).then((r) => r.json())
        console.log(response)
        const tags = response.map((pred: { tag: string }) => pred.tag) // Extract tags
        setRecognizedTags(tags)
      } catch (error) {
        console.error('Error recognizing image:', error)
      }
    }
  }

  const searchImages = async () => {
    setQueryInitialized(true)
    if (searchQuery) {
      try {
        const response = await fetch(
          `${SERVER_URL}/search-images?query=${searchQuery}`
        ).then((r) => r.json())
        setSearchResults(response)
      } catch (error) {
        console.error('Error searching images:', error)
        setSearchResults([])
      }
    }
  }

  return (
    <div className='form'>
      <input type='file' accept='image/*' onChange={handleImageChange} />
      {imgSrc && (
        <div className='image'>
          <img src={imgSrc as string} alt='Uploaded' width='300' />
          <button onClick={recognizeImage}>Recognize Image</button>
          <hr />
        </div>
      )}
      <div>
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => {
            setQueryInitialized(false)
            setSearchQuery(e.target.value)
          }}
          placeholder='Search for tags...'
        />
        <button onClick={searchImages}>Search</button>
      </div>
      {searchResults.length > 0 && (
        <div>
          <h2>Search Results:</h2>
          <ul>
            {searchResults && // eslint-disable-next-line @typescript-eslint/no-explicit-any
              searchResults.map((result: any, index) => (
                <li key={index}>
                  <strong>file name:</strong> {result['file-name']}
                  {result.tags && (
                    <>
                      <strong>{` confidence: `}</strong>
                      {result.tags.find((r: { tag: string }) =>
                        searchQuery.includes(r.tag)
                      )?.confidence || '0'}
                    </>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
      {searchResults.length === 0 && searchQuery && isQueryInitialized && (
        <div className='not-found'>
          <p>No results found.</p>
        </div>
      )}
    </div>
  )
}

export default ImageUploader
