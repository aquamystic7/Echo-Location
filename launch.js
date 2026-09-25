{
    // debug configs. attach needs chrome started with --remote-debugging-port=9222
    "version": "0.2.0",
    "configurations": [
        {
            "name": "localhost:8080",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:8080"
        },
        {
            "type": "chrome",
            "request": "launch",
            "name": "just open the html",
            "file": "/home/xgly/Echo-Location/index.html"
        },
        {
            "name": "attach 9222",
            "type": "chrome",
            "request": "attach",
            "port": 9222
        }
    ]
}
