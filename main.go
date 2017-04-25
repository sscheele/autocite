package main

import (
	"fmt"
	"net/http"

	"github.com/sscheele/autocite/routes"
)

func main() {
	fmt.Println("Listening on http://localhost:8080")
	http.ListenAndServe(":8080", routes.Mux)
}
