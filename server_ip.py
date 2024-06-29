#!/usr/bin/env python

if __name__ == '__main__':

    def run(app):
        import sys
        from werkzeug.serving import run_simple
        import socket

        host = socket.gethostbyname(socket.gethostname())  #"18.185.100.193"  "192.168.0.53" 192.168.1.127  ;  192.168.60.1  ;  172.31.36.78
        try:
            port = int(sys.argv[1])
        except:
            port = 8080
        run_simple(host, port, app, threaded=True, use_debugger=True)

    from jam.wsgi import create_application
    #from jam.wsgi_server import run

    application = create_application(__file__)
    run(application)
