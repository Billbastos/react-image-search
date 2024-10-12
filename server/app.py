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