{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "localhost:8080",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:8080",
            "webRoot": "${workspaceFolder}"
        },
        {
            "type": "chrome",
            "request": "launch",
            "name": "just open the html",
            "file": "${workspaceFolder}/index.html"
        },
        {
            "name": "attach 9222",
            "type": "chrome",
            "request": "attach",
            "port": 9222,
            "webRoot": "${workspaceFolder}"
        }
    ]
}
