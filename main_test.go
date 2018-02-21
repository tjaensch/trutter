package main

import (
	"os"
	"testing"
)

func TestGetTweets(t *testing.T) {
	downloadTweets()
	file, err := os.Stat("./tweets/tweets.json")
	if err != nil {
		t.Error("File not found, got", file)
	}
}
