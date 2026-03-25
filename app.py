"""
Sistema de Numeración Binaria - Aplicación Educativa
Autor: Claude (Anthropic)
Descripción: App Flask para enseñar sistema binario de forma interactiva
"""

from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# ─────────────────────────────────────────────
#  RUTAS PRINCIPALES
# ─────────────────────────────────────────────

@app.route('/')
def index():
    """Página principal con menú de módulos."""
    return render_template('index.html')


# ─────────────────────────────────────────────
#  API: CONVERSIONES
# ─────────────────────────────────────────────

@app.route('/api/binary_to_decimal', methods=['POST'])
def binary_to_decimal():
    """
    Convierte un número binario a decimal con pasos detallados.
    Espera: { "binary": "1011" }
    """
    data = request.get_json()
    binary_str = data.get('binary', '').strip()

    # Validar que solo contenga 0 y 1
    if not binary_str or not all(c in '01' for c in binary_str):
        return jsonify({'error': 'Solo se permiten dígitos 0 y 1'}), 400

    if len(binary_str) > 32:
        return jsonify({'error': 'Máximo 32 bits permitidos'}), 400

    # Calcular con pasos
    steps = []
    total = 0
    n = len(binary_str)
    for i, bit in enumerate(binary_str):
        power = n - 1 - i
        value = int(bit) * (2 ** power)
        total += value
        steps.append({
            'bit': bit,
            'position': power,
            'power_of_2': 2 ** power,
            'value': value
        })

    return jsonify({
        'binary': binary_str,
        'decimal': total,
        'steps': steps
    })


@app.route('/api/decimal_to_binary', methods=['POST'])
def decimal_to_binary():
    """
    Convierte un número decimal a binario con divisiones sucesivas.
    Espera: { "decimal": 42 }
    """
    data = request.get_json()
    try:
        num = int(data.get('decimal', ''))
    except (ValueError, TypeError):
        return jsonify({'error': 'Ingresa un número entero válido'}), 400

    if num < 0 or num > 65535:
        return jsonify({'error': 'Usa un número entre 0 y 65535'}), 400

    if num == 0:
        return jsonify({
            'decimal': 0,
            'binary': '0',
            'steps': [{'dividend': 0, 'quotient': 0, 'remainder': 0}]
        })

    steps = []
    n = num
    while n > 0:
        quotient = n // 2
        remainder = n % 2
        steps.append({'dividend': n, 'quotient': quotient, 'remainder': remainder})
        n = quotient

    binary_result = ''.join(str(s['remainder']) for s in reversed(steps))

    return jsonify({
        'decimal': int(data.get('decimal')),
        'binary': binary_result,
        'steps': steps
    })


# ─────────────────────────────────────────────
#  API: EJERCICIOS ALEATORIOS
# ─────────────────────────────────────────────

@app.route('/api/exercise/bin_to_dec', methods=['GET'])
def exercise_bin_to_dec():
    """Genera un ejercicio aleatorio de binario a decimal."""
    difficulty = request.args.get('difficulty', 'easy')
    if difficulty == 'easy':
        num = random.randint(1, 15)       # 4 bits
    elif difficulty == 'medium':
        num = random.randint(16, 255)     # 8 bits
    else:
        num = random.randint(256, 1023)   # 10 bits
    binary = bin(num)[2:]
    return jsonify({'binary': binary, 'answer': num})


@app.route('/api/exercise/dec_to_bin', methods=['GET'])
def exercise_dec_to_bin():
    """Genera un ejercicio aleatorio de decimal a binario."""
    difficulty = request.args.get('difficulty', 'easy')
    if difficulty == 'easy':
        num = random.randint(1, 15)
    elif difficulty == 'medium':
        num = random.randint(16, 255)
    else:
        num = random.randint(256, 1023)
    binary = bin(num)[2:]
    return jsonify({'decimal': num, 'answer': binary})


# ─────────────────────────────────────────────
#  API: JUEGO BINARIO
# ─────────────────────────────────────────────

@app.route('/api/game/question', methods=['GET'])
def game_question():
    """
    Genera una pregunta para el juego con 4 opciones.
    mode: 'bin2dec' o 'dec2bin'
    difficulty: 'easy', 'medium', 'hard'
    """
    mode = request.args.get('mode', 'bin2dec')
    difficulty = request.args.get('difficulty', 'easy')

    if difficulty == 'easy':
        correct = random.randint(1, 15)
    elif difficulty == 'medium':
        correct = random.randint(16, 127)
    else:
        correct = random.randint(128, 255)

    # Generar 3 distractores únicos
    distractors = set()
    while len(distractors) < 3:
        d = correct + random.choice([-3, -2, -1, 1, 2, 3, 4, 5, -4, -5])
        if d > 0 and d != correct:
            distractors.add(d)
    distractors = list(distractors)

    if mode == 'bin2dec':
        question = bin(correct)[2:]
        correct_answer = str(correct)
        options = [str(correct)] + [str(d) for d in distractors]
    else:
        question = str(correct)
        correct_answer = bin(correct)[2:]
        options = [bin(correct)[2:]] + [bin(d)[2:] for d in distractors]

    random.shuffle(options)

    return jsonify({
        'question': question,
        'options': options,
        'correct': correct_answer,
        'mode': mode
    })


# ─────────────────────────────────────────────
#  API: HEXADECIMAL
# ─────────────────────────────────────────────

@app.route('/api/decimal_to_hex', methods=['POST'])
def decimal_to_hex():
    data = request.get_json()
    try:
        num = int(data.get('decimal', ''))
    except:
        return jsonify({'error': 'Número inválido'}), 400

    if num < 0:
        return jsonify({'error': 'Debe ser positivo'}), 400

    return jsonify({
        'decimal': num,
        'hex': hex(num)[2:].upper()
    })


@app.route('/api/hex_to_decimal', methods=['POST'])
def hex_to_decimal():
    data = request.get_json()
    hex_val = data.get('hex', '').strip()

    try:
        decimal = int(hex_val, 16)
    except:
        return jsonify({'error': 'Hexadecimal inválido'}), 400

    return jsonify({
        'hex': hex_val.upper(),
        'decimal': decimal
    })


@app.route('/api/binary_to_hex', methods=['POST'])
def binary_to_hex():
    data = request.get_json()
    binary = data.get('binary', '').strip()

    if not all(c in '01' for c in binary):
        return jsonify({'error': 'Binario inválido'}), 400

    decimal = int(binary, 2)
    return jsonify({
        'binary': binary,
        'hex': hex(decimal)[2:].upper()
    })


@app.route('/api/hex_to_binary', methods=['POST'])
def hex_to_binary():
    data = request.get_json()
    hex_val = data.get('hex', '').strip()

    try:
        decimal = int(hex_val, 16)
    except:
        return jsonify({'error': 'Hexadecimal inválido'}), 400

    return jsonify({
        'hex': hex_val.upper(),
        'binary': bin(decimal)[2:]
    })

# ─────────────────────────────────────────────
#  API: IPv4
# ─────────────────────────────────────────────

@app.route('/api/ipv4/to_binary', methods=['POST'])
def ipv4_to_binary():
    """
    Convierte una dirección IPv4 decimal a binario por octeto.
    Espera: { "ip": "192.168.1.1" }
    """
    data = request.get_json()
    ip = data.get('ip', '').strip()
    parts = ip.split('.')

    if len(parts) != 4:
        return jsonify({'error': 'Formato inválido. Usa: X.X.X.X'}), 400

    octets = []
    for part in parts:
        try:
            val = int(part)
            if not 0 <= val <= 255:
                raise ValueError
        except ValueError:
            return jsonify({'error': f'Valor "{part}" inválido. Cada octeto debe estar entre 0 y 255'}), 400
        binary = format(val, '08b')
        octets.append({'decimal': val, 'binary': binary})

    return jsonify({'ip': ip, 'octets': octets})


@app.route('/api/ipv4/to_decimal', methods=['POST'])
def ipv4_to_decimal():
    """
    Convierte una dirección IPv4 en binario a decimal por octeto.
    Espera: { "ip": "11000000.10101000.00000001.00000001" }
    """
    data = request.get_json()
    ip = data.get('ip', '').strip()
    parts = ip.split('.')

    if len(parts) != 4:
        return jsonify({'error': 'Formato inválido. Usa 4 octetos separados por puntos'}), 400

    octets = []
    for part in parts:
        if len(part) != 8 or not all(c in '01' for c in part):
            return jsonify({'error': f'"{part}" no es un octeto binario válido (debe tener exactamente 8 bits)'}), 400
        val = int(part, 2)
        octets.append({'binary': part, 'decimal': val})

    decimal_ip = '.'.join(str(o['decimal']) for o in octets)
    return jsonify({'ip': ip, 'decimal_ip': decimal_ip, 'octets': octets})


# ─────────────────────────────────────────────
#  API: CUESTIONARIO
# ─────────────────────────────────────────────

@app.route('/api/quiz/questions', methods=['GET'])
def get_quiz_questions():
    """Devuelve las preguntas del cuestionario de comprensión."""
    questions = [
        {
            "id": 1,
            "question": "¿Cuántos dígitos utiliza el sistema de numeración binario?",
            "options": ["1", "2", "8", "10"],
            "correct": "2",
            "explanation": "El sistema binario usa solo dos dígitos: 0 y 1."
        },
        {
            "id": 2,
            "question": "¿Cuál es el valor decimal de 1010 en binario?",
            "options": ["8", "10", "12", "6"],
            "correct": "10",
            "explanation": "1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8+0+2+0 = 10"
        },
        {
            "id": 3,
            "question": "¿Cuántos bits componen un byte?",
            "options": ["4", "16", "8", "32"],
            "correct": "8",
            "explanation": "Un byte está compuesto por 8 bits."
        },
        {
            "id": 4,
            "question": "¿Cuántos octetos tiene una dirección IPv4?",
            "options": ["2", "4", "6", "8"],
            "correct": "4",
            "explanation": "Una dirección IPv4 tiene 4 octetos separados por puntos, ej: 192.168.1.1"
        },
        {
            "id": 5,
            "question": "¿Cuál es el valor de la posición 2³ en binario?",
            "options": ["3", "6", "8", "16"],
            "correct": "8",
            "explanation": "2³ = 2×2×2 = 8"
        },
        {
            "id": 6,
            "question": "¿Cuál es el equivalente binario de 13 en decimal?",
            "options": ["1011", "1101", "1110", "0111"],
            "correct": "1101",
            "explanation": "13 = 8+4+1 = 2³+2²+2⁰ = 1101 en binario"
        },
        {
            "id": 7,
            "question": "¿Cuál es el rango de valores de un octeto IPv4?",
            "options": ["0 a 127", "0 a 255", "1 a 256", "0 a 512"],
            "correct": "0 a 255",
            "explanation": "Con 8 bits se pueden representar 256 valores: del 0 al 255."
        },
        {
            "id": 8,
            "question": "¿Qué sistema de numeración usa la base 10?",
            "options": ["Binario", "Hexadecimal", "Octal", "Decimal"],
            "correct": "Decimal",
            "explanation": "El sistema decimal usa 10 dígitos (0-9) y tiene base 10."
        }
    ]
    # Mezclar y devolver 6 preguntas
    random.shuffle(questions)
    return jsonify(questions[:6])


# ─────────────────────────────────────────────
#  INICIO
# ─────────────────────────────────────────────

import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)