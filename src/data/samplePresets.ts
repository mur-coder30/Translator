export interface CodePreset {
  title: string;
  sourceLangHint: string;
  targetLang: string;
  description: string;
  code: string;
}

export interface NaturalPreset {
  title: string;
  text: string;
  targetLanguage: string;
  category: string;
  languageHint: string;
}

export const CODE_PRESETS: CodePreset[] = [
  {
    title: 'C++ to Binary Machine Bits',
    sourceLangHint: 'C++',
    targetLang: 'Binary (Machine 0s & 1s)',
    description: 'Pointer arithmetic & loop printing ASCII characters to raw 8-bit binary representation',
    code: `#include <iostream>

void print_greeting() {
    const char msg[] = "HELLO";
    for (int i = 0; i < 5; ++i) {
        std::cout << *(msg + i);
    }
    std::cout << std::endl;
}

int main() {
    print_greeting();
    return 0;
}`,
  },
  {
    title: 'C++ Fast Fibonacci to Binary & Hex',
    sourceLangHint: 'C++',
    targetLang: 'Binary (Machine 0s & 1s)',
    description: 'Iterative Fibonacci computation translated to binary opcode sequence',
    code: `#include <cstdint>

uint64_t fibonacci(uint32_t n) {
    if (n <= 1) return n;
    uint64_t a = 0, b = 1;
    for (uint32_t i = 2; i <= n; ++i) {
        uint64_t temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
  },
  {
    title: 'C++ Pointer Swap to x86-64 Assembly',
    sourceLangHint: 'C++',
    targetLang: 'x86-64 Assembly (NASM)',
    description: 'Low-level pointer swapping and memory exchange mapped to hardware registers',
    code: `void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}`,
  },
  {
    title: 'Python Binary Search to Rust',
    sourceLangHint: 'Python',
    targetLang: 'Rust (2024 Edition)',
    description: 'Dynamic Python array slicing to idiomatic Rust slice pattern matching with Result/Option',
    code: `def binary_search(arr: list[int], target: int) -> int:
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
  },
  {
    title: 'C++ Bitwise Masking to WebAssembly (WAT)',
    sourceLangHint: 'C++',
    targetLang: 'WebAssembly (WAT)',
    description: 'Bitwise bit shifts and XOR encryption mapped to stack-based WASM primitives',
    code: `unsigned int xor_hash(unsigned int data, unsigned int key) {
    unsigned int hash = (data << 5) | (data >> 27);
    return hash ^ key;
}`,
  },
  {
    title: 'Python String Echo to Brainfuck',
    sourceLangHint: 'Python',
    targetLang: 'Brainfuck (Esoteric VM)',
    description: 'Simple character accumulator converted to minimalist 8-operator pointer loops',
    code: `print("Hi!")`,
  }
];

export const NATURAL_PRESETS: NaturalPreset[] = [
  {
    title: 'Japanese Street Sign',
    text: 'この先、工事中のため通行止めです。歩行者は右側の仮設歩道をご利用ください。',
    targetLanguage: 'English',
    category: 'Signage & Navigation',
    languageHint: 'Japanese',
  },
  {
    title: 'French Café Menu',
    text: 'Formule Déjeuner : Velouté de potimarron aux éclats de châtaigne, Pavé de saumon rôti avec mousseline de panais, Tarte tatin maison tiède.',
    targetLanguage: 'English',
    category: 'Dining & Menus',
    languageHint: 'French',
  },
  {
    title: 'Spanish Emergency Notice',
    text: 'Atención: Por favor conserve la calma. El servicio de metro se encuentra temporalmente suspendido debido a una revisión técnica en la vía principal.',
    targetLanguage: 'English',
    category: 'Travel & Alerts',
    languageHint: 'Spanish',
  },
  {
    title: 'German Tech Manual',
    text: 'Vor der Inbetriebnahme des Gerätes ist sicherzustellen, dass die Versorgungsspannung den Angaben auf dem Typenschild entspricht. Bei Überhitzung schaltet sich der Schutzschalter automatisch ab.',
    targetLanguage: 'Spanish',
    category: 'Technical Documentation',
    languageHint: 'German',
  },
  {
    title: 'Arabic Greeting & Proverb',
    text: 'أهلاً وسهلاً بكم. الصبر مفتاح الفرج، ومن جدّ وجد ومن سار على الدرب وصل.',
    targetLanguage: 'French',
    category: 'Proverbs & Culture',
    languageHint: 'Arabic',
  }
];
