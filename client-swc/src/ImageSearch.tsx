import { useState } from 'react'
import './ImageSearch.css'
import { FLASK_API_URL } from './utils/config'

const ImageSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedResult, setSearchedResult] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isQueryInitialized, setQueryInitialized] = useState(false)

  const searchImages = async () => {
    setQueryInitialized(true)
    if (searchQuery) {
      try {
        const response = await fetch(
          `${FLASK_API_URL}/search-images?query=${searchQuery}`
        ).then((r) => r.json())
        setSearchResults(response)
        setSearchedResult(searchQuery)
      } catch (error) {
        console.error('Error searching images:', error)
        setSearchResults([])
        setSearchedResult('')
      }
    }
  }

  return (
    <section className='search-section'>
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
          <ul>
            {searchResults && // eslint-disable-next-line @typescript-eslint/no-explicit-any
              searchResults.map((result: any, index) => (
                <li key={index}>
                  <strong>file name:</strong> {result['file-name']}
                  {result.tags && (
                    <>
                      <strong>{` confidence: `}</strong>
                      {result.tags.find((r: { tag: string }) =>
                        searchedResult.includes(r.tag)
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
    </section>
  )
}

export default ImageSearch
