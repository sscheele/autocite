package routes

import (
	"fmt"
	"net/http"

	"github.com/go-zoo/bone"
)

//Mux is our multiplexer
var Mux *bone.Mux

func init() {
	Mux = bone.New()

	//Root route
	Mux.GetFunc("/", rootHandler)
	Mux.GetFunc("/static/", staticHandler)
	Mux.GetFunc("/autocite", autociteHandler)
}

func rootHandler(rw http.ResponseWriter, req *http.Request) {
	fmt.Fprint(rw, "Hello, world!")
}

func staticHandler(rw http.ResponseWriter, req *http.Request) {
	//serve static files, removing leading slash
	http.ServeFile(rw, req, req.URL.Path[1:])
}

func autociteHandler(rw http.ResponseWriter, req *http.Request) {
	http.ServeFile(rw, req, "static/html/autocite/index.html")
}
