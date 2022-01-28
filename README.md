# Game of Life
This project is a simple implementation of the famous [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life). All the game's logic was implemented in Rust, and the user interface was written in HTML and Javascript. The game runs entirely in the browser, thanks to WebAssembly.

## Why another Conway's Game of Life implementation?
Well, currently, I'm learning Rust and WebAssembly, so I thought it would be a fun way to practice what I learned building this little project over the weekend. Also, it's been a while since the last time I wrote something in the front-end. Usually, my projects are related to back-end technologies, so it's always good to go back to remember and practice technologies that you have not used for a while.

## Compile the WASM Rust library
~~~
wasm-pack build --target web
~~~

## Test the WASM Rustlibrary
~~~
cargo test --lib -- --nocapture
~~~

## References
* [Rust and WebAssembly](https://rustwasm.github.io/docs/book/introduction.html)
* [Compiling from Rust to WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly/Rust_to_wasm)
* [Conway's Game of Life - JavaScript by Robert Spatz](https://codepen.io/RBSpatz/pen/rLyNLb)
* [Crear ventana modal solo con CSS3 sin JavaScript](https://devcode.la/tutoriales/crear-ventana-modal-solo-con-css3/)
