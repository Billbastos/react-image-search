import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = ({ setRecognizedTags }) => {
  const [image, setImage] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result);
        setImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const recognizeImage = async () => {
    if (image) {
      const formData = new FormData();
      formData.append('image', image);

      try {
        const response = await axios.post(
          'http://localhost:5000/recognize-image',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        const tags = response.data.map((pred) => pred[1]); // Extract tags
        setRecognizedTags(tags);
      } catch (error) {
        console.error('Error recognizing image:', error);
      }
    }
  };

  const searchImages = async () => {
    if (searchQuery) {
      try {
        const response = await axios.get(
          `http://localhost:5000/search-images?query=${searchQuery}`
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching images:', error);
      }
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {imgSrc && (
        <div>
          <img src={imgSrc} alt="Uploaded" width="300" />
          <button onClick={recognizeImage}>Recognize Image</button>
        </div>
      )}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for tags..."
        />
        <button onClick={searchImages}>Search</button>
      </div>
      {searchResults.length > 0 && (
        <div>
          <h2>Search Results:</h2>
          <ul>
            {searchResults.map((result, index) => (
              <li key={index}>{JSON.stringify(result)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
