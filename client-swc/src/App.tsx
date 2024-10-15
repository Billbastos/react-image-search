import { useState } from 'react'
import ImageUploader from './ImageUploader'

const App = () => {
  const [recognizedTags, setRecognizedTags] = useState<string[]>([])

  return (
    <div>
      <h1>Image Recognition POC</h1>
      <ImageUploader setRecognizedTags={setRecognizedTags} />
      {recognizedTags.length > 0 && (
        <>
          <hr />
          <div>
            <h2>Recognized Tags:</h2>
            <p>{recognizedTags.join(', ')}</p>
          </div>
        </>
      )}
    </div>
  )
}

export default App
