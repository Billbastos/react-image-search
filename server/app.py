from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from PIL import Image
import numpy as np
import tensorflow as tf
from elasticsearch import Elasticsearch
import os
from dotenv import load_dotenv

# Config FLASK and elasticSearch
load_dotenv()
ES_PASSWORD = os.getenv('ES_LOCAL_PASSWORD')
ES_URL = os.getenv('ES_LOCAL_URL')
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Initialize Elasticsearch
es = Elasticsearch(
    hosts=ES_URL,
    basic_auth=("elastic", ES_PASSWORD)
)

# Load the MobileNet model
model = tf.keras.applications.MobileNetV2(weights='imagenet', alpha=0.35)

def prepare_image(image):
    image = image.resize((224, 224))
    image = np.array(image)
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    return np.expand_dims(image, axis=0)

@app.route('/recognize-image', methods=['POST'])
@cross_origin()
def recognize_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    file = request.files['image']
    image = Image.open(file.stream)
    image = prepare_image(image)
    predictions = model.predict(image)
    decoded_predictions = tf.keras.applications.mobilenet_v2.decode_predictions(predictions)
    print(decoded_predictions)
    # Store recognized tags in Elasticsearch
    tags = []
    for prediction_list in decoded_predictions:
        for pred in prediction_list:  # Loop through each tuple in the inner list
            tag = pred[1]  # Extract the label (e.g., 'candle')
            confidence = float(pred[2])  # Extract the confidence (e.g., 0.3443646)
            tags.append({"tag": tag, "confidence": confidence})

    # Manages indices and id existence. 
    if es.indices.exists(index="images"):
        if not es.exists(index='images', id=file.filename):
            es.create(index='images', id=file.filename, body={"tags": tags, "file-name": file.filename})
    else:
        es.index(index='images', id=file.filename, body={"tags": tags, "file-name": file.filename})
    
    return jsonify(tags), 200

@app.route('/search-images', methods=['GET'])
def search_images():
    query = request.args.get('query')
    if not query:
        return jsonify({'error': 'No search query provided'}), 400

    # Search in Elasticsearch
    results = []
    if es.indices.exists(index="images"):
        response = es.search(index='images', body={
            "query": {
                "match": {
                    "tags.tag": query
                }
            }
        })

        for hit in response['hits']['hits']:
            results.append(hit['_source'])

    return jsonify(results)

if __name__ == '__main__':
    app.run(port=5000)