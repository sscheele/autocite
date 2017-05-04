package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"
)

var configJSON []byte
var configMut sync.Mutex

func init() {
	var err error
	configJSON, err = ioutil.ReadFile("static/js/autocite/learn/config.json")
	if err != nil {
		panic(err)
	}
}

func main() {
	fmt.Println("Listening on http://localhost:8080")
	http.ListenAndServe(":8080", http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			//do some post stuff with r.PostForm
			return
		}
		rw.Write(configJSON) //default for GET
	}))
}
