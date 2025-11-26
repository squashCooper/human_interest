
from flask import Flask, send_from_directory, request, jsonify
import os
import json

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def frontpage():
    return send_from_directory('.', 'frontpage.html')

@app.route('/api/contribution', methods=['GET'])
def get_contribution():
    try:
        user_data_file = 'user_current_contribution.json'
        if os.path.exists(user_data_file):
            with open(user_data_file, 'r') as f:
                data = json.load(f)
                return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'success': True, 'data': {
                'contribution_type': 'percentage',
                'contribution_percent': 3,
                'contribution_dollar_amount': '',
                'number_of_paychecks': ''
            }})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/contribution', methods=['POST'])
def set_contribution():
    try:
        data = request.get_json()
        
        user_data = {
            'contribution_type': data.get('contribution_type', ''),
            'contribution_percent': data.get('contribution_percent', ''),
            'contribution_dollar_amount': data.get('contribution_dollar_amount', ''),
            'number_of_paychecks': data.get('number_of_paychecks', ''),
            'salary': data.get('salary', ''),
        }
        
        with open('user_current_contribution.json', 'w') as f:
            json.dump(user_data, f)
        
        json_file = 'user_mock_data.json'
        
        try:
            with open(json_file, 'r') as f:
                existing_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = []
     
        new_entry = {
            'salary': data.get('salary', ''),
            'contribution_percent': data.get('contribution_percent', ''),
            'contribution_dollar_amount': data.get('contribution_dollar_amount', ''),
            'number_of_paychecks': data.get('number_of_paychecks', ''),
        }
        existing_data.append(new_entry)
        
        with open(json_file, 'w') as f:
            json.dump(existing_data, f, indent=2)
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/ytd-data', methods=['GET'])
def get_ytd_data():
    try:
        with open('user_mock_data.json', 'r') as f:
            data = json.load(f)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(port=5560, debug=True)