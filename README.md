# How the Internet Was Born

A static, single-page website on the history of the Internet's creation (1957–1995): an interactive timeline, the people behind it, the key technical ideas and a short quiz.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Structure

- `index.html` – page layout
- `css/style.css` – styles (dark/light themes, responsive)
- `js/data.js` – timeline milestones, pioneers and quiz questions
- `js/main.js` – rendering and interactions
