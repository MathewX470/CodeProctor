/**
 * Language configurations for Docker execution.
 */
export const languageConfig = {
  c: {
    image: 'runner-c:latest',
    fileName: 'main.c',
    compileCommand: 'gcc -O2 main.c -o main',
    runCommand: './main',
  },
  cpp: {
    image: 'runner-cpp:latest',
    fileName: 'main.cpp',
    compileCommand: 'g++ -O2 main.cpp -o main',
    runCommand: './main',
  },
  java: {
    image: 'runner-java:latest',
    fileName: 'Main.java',
    compileCommand: 'javac Main.java',
    runCommand: 'java Main',
  },
  python3: {
    image: 'runner-python:latest',
    fileName: 'main.py',
    compileCommand: null, // Interpreted
    runCommand: 'python3 main.py',
  },
  javascript: {
    image: 'runner-node:latest',
    fileName: 'main.js',
    compileCommand: null, // Interpreted
    runCommand: 'node main.js',
  },
};
