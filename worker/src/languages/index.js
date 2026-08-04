/**
 * Language configurations for Docker execution.
 */
export const languageConfig = {
  c: {
    image: 'runner-c:latest',
    fileName: 'main.c',
    getRunCommand: () => `gcc -O2 main.c -o main && ./main`,
  },
  cpp: {
    image: 'runner-cpp:latest',
    fileName: 'main.cpp',
    getRunCommand: () => `g++ -O2 main.cpp -o main && ./main`,
  },
  java: {
    image: 'runner-java:latest',
    fileName: 'Main.java',
    getRunCommand: () => `javac Main.java && java Main`,
  },
  python: {
    image: 'runner-python:latest',
    fileName: 'main.py',
    getRunCommand: () => `python3 main.py`,
  },
  javascript: {
    image: 'runner-node:latest',
    fileName: 'main.js',
    getRunCommand: () => `node main.js`,
  },
};
