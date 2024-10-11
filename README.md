# Proof of Concept: Image Recognition with Flask, TensorFlow, and Elasticsearch
A full stack POC where users can upload images, recognize tags using a Python Flask API, store the tags in Elasticsearch, and search for recognized tags through the React front-end. Solution for handling image recognition and retrieval.

## Project Overview

This proof of concept (POC) allows users to upload images, process them with a Python Flask API for image recognition using TensorFlow, store recognized tags in Elasticsearch, and search for images based on the tags through a React front-end.

## Technologies Used
- **Front-end**: React
- **Back-end**: Flask (Python) for image recognition
- **Search**: Elasticsearch for storing and querying recognized tags
- **File Upload**: Flask for handling uploads

## Step-by-Step Implementation

### 1. Set Up the Python Flask API

**Install Required Packages**:
```bash
pip install Flask Pillow tensorflow elasticsearch
```

**Create the Flask Server**:

Create a file named `app.py`:

```python
from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import tensorflow as tf
from elasticsearch import Elasticsearch

app = Flask(__name__)

# Initialize Elasticsearch
es = Elasticsearch(['http://localhost:9200'])

# Load the MobileNet model
model = tf.keras.applications.MobileNetV2(weights='imagenet')

def prepare_image(image):
    image = image.resize((224, 224))
    image = np.array(image)
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    return np.expand_dims(image, axis=0)

@app.route('/recognize-image', methods=['POST'])
def recognize_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    file = request.files['image']
    image = Image.open(file.stream)
    image = prepare_image(image)
    predictions = model.predict(image)
    decoded_predictions = tf.keras.applications.mobilenet_v2.decode_predictions(predictions)

    # Store recognized tags in Elasticsearch
    tags = [{"tag": pred[1], "confidence": pred[2]} for pred in decoded_predictions]
    es.index(index='images', body={"tags": tags})

    return jsonify(decoded_predictions[0])

@app.route('/search-images', methods=['GET'])
def search_images():
    query = request.args.get('query')
    if not query:
        return jsonify({'error': 'No search query provided'}), 400

    # Search in Elasticsearch
    response = es.search(index='images', body={
        "query": {
            "match": {
                "tags.tag": query
            }
        }
    })

    results = []
    for hit in response['hits']['hits']:
        results.append(hit['_source'])

    return jsonify(results)

if __name__ == '__main__':
    app.run(port=5000)
```

**Run the Flask Server**:
```bash
python app.py
```

### 2. Set Up the React Front-End

**Create a React App**:
```bash
npx create-react-app image-recognition-poc
cd image-recognition-poc
npm install axios
```

**Create an Image Upload Component**:

Create a file named `ImageUploader.js`:

```javascript
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
                const response = await axios.post('http://localhost:5000/recognize-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const tags = response.data.map(pred => pred[1]); // Extract tags
                setRecognizedTags(tags);
            } catch (error) {
                console.error('Error recognizing image:', error);
            }
        }
    };

    const searchImages = async () => {
        if (searchQuery) {
            try {
                const response = await axios.get(`http://localhost:5000/search-images?query=${searchQuery}`);
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
```

**Update Your Main App Component**:

In `src/App.js`, include the `ImageUploader` component:

```javascript
import React, { useState } from 'react';
import ImageUploader from './ImageUploader';

const App = () => {
    const [recognizedTags, setRecognizedTags] = useState([]);

    return (
        <div>
            <h1>Image Recognition POC</h1>
            <ImageUploader setRecognizedTags={setRecognizedTags} />
            {recognizedTags.length > 0 && (
                <div>
                    <h2>Recognized Tags:</h2>
                    <p>{recognizedTags.join(', ')}</p>
                </div>
            )}
        </div>
    );
};

export default App;
```

### 3. Finalize and Run Your Application

- Make sure your Elasticsearch server is running.
- Start your Flask server: `python app.py`.
- Start your React app: `npm start`.

### Testing the Application

1. Open your browser and navigate to `http://localhost:3000`.
2. Upload an image and click "Recognize Image" to process it and store the tags in Elasticsearch.
3. Enter a search query in the search bar and click "Search" to retrieve images associated with the specified tags.

### Summary
Now your proof of concept includes a full stack where users can upload images, recognize tags using a Python Flask API, store the tags in Elasticsearch, and search for recognized tags through the React front-end. This provides a robust solution for handling image recognition and retrieval.

Feel free to modify and expand upon this code based on your specific requirements.

