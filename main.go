package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	// Imports the Google Cloud Natural Language API client package.
	language "cloud.google.com/go/language/apiv1"
	"golang.org/x/net/context"
	languagepb "google.golang.org/genproto/googleapis/cloud/language/v1"
)

type Tweet struct {
	Id        string
	Time      string
	Text      string
	Sentiment string
}

type KeysResponse struct {
	tweetsCollection []Tweet
}

type analysisStrings struct {
	OverallSentiment          string
	OverallSentimentAdjective string
}

type data struct {
	tweets []Tweet
}

func getCurrentDate() string {
	current_time := time.Now().Local()
	return current_time.Format("2006-01-02")
}

func downloadTweets() {
	out, _ := os.Create("./tweets/tweets.json")
	defer out.Close()
	resp, _ := http.Get("http://35.229.87.102/")
	defer resp.Body.Close()
	_, err := io.Copy(out, resp.Body)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
}

func getTweets() []Tweet {
	tweets := make([]Tweet, 0)
	raw, err := ioutil.ReadFile("./tweets/tweets.json")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
	json.Unmarshal(raw, &tweets)
	return tweets
}

func countTweets(tweets []Tweet) int {
	return len(tweets)
}

func analyzeSentimentSingle(tweets []Tweet) (int, int) {
	ctx := context.Background()
	countPositive := 0
	countNegative := 0

	// Creates a client.
	client, err := language.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// Sets the text to analyze.
	var text string
	for i, _ := range tweets {
		//text += tweets[i].Text + " "

		text = tweets[i].Text

		// Detects the sentiment of the text.
		sentiment, err := client.AnalyzeSentiment(ctx, &languagepb.AnalyzeSentimentRequest{
			Document: &languagepb.Document{
				Source: &languagepb.Document_Content{
					Content: text,
				},
				Type: languagepb.Document_PLAIN_TEXT,
			},
			EncodingType: languagepb.EncodingType_UTF8,
		})
		if err != nil {
			log.Fatalf("Failed to analyze text: %v", err)
		}

		fmt.Printf("Text: %v\n", text)
		fmt.Println(sentiment.DocumentSentiment.Score)
		if sentiment.DocumentSentiment.Score >= 0 {
			fmt.Println("Sentiment: positive")
			countPositive++
			tweets[i].Sentiment = "positive"
		} else {
			fmt.Println("Sentiment: negative")
			countNegative++
			tweets[i].Sentiment = "negative"
		}
	}
	return countPositive, countNegative
}

func analyzeSentimentAll(tweets []Tweet) (bool, float32) {
	var allTweetsAnalysisPositive bool
	ctx := context.Background()

	// Creates a client.
	client, err := language.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// Sets the text to analyze.
	var text string
	for i, _ := range tweets {
		text += tweets[i].Text + " "
	}

	// Detects the sentiment of the text.
	sentiment, err := client.AnalyzeSentiment(ctx, &languagepb.AnalyzeSentimentRequest{
		Document: &languagepb.Document{
			Source: &languagepb.Document_Content{
				Content: text,
			},
			Type: languagepb.Document_PLAIN_TEXT,
		},
		EncodingType: languagepb.EncodingType_UTF8,
	})
	if err != nil {
		log.Fatalf("Failed to analyze text: %v", err)
	}

	//fmt.Printf("Text: %v\n", text)
	fmt.Println(sentiment.DocumentSentiment.Score)
	if sentiment.DocumentSentiment.Score >= 0 {
		//fmt.Println("Sentiment: positive")
		allTweetsAnalysisPositive = true
	} else {
		//fmt.Println("Sentiment: negative")
		allTweetsAnalysisPositive = false
	}

	return allTweetsAnalysisPositive, sentiment.DocumentSentiment.Score
}

func getBottomLineSentiment(allTweetsAnalysisPositive bool, sentimentScore float32) analysisStrings {
	var analysisResults []string

	if allTweetsAnalysisPositive == true {
		analysisResults = append(analysisResults, "POSITIVE")
	} else {
		analysisResults = append(analysisResults, "NEGATIVE")
	}

	switch sentimentScore {
	case 0.9:
		analysisResults = append(analysisResults, "ecstatic")
	case 0.8:
		analysisResults = append(analysisResults, "ecstatic")
	case 0.7:
		analysisResults = append(analysisResults, "ecstatic")
	case 0.6:
		analysisResults = append(analysisResults, "ecstatic")
	case 0.5:
		analysisResults = append(analysisResults, "thrilled")
	case 0.4:
		analysisResults = append(analysisResults, "overjoyed")
	case 0.3:
		analysisResults = append(analysisResults, "happy")
	case 0.2:
		analysisResults = append(analysisResults, "cheery")
	case 0.1:
		analysisResults = append(analysisResults, "pleased")
	case 0.0:
		analysisResults = append(analysisResults, "okay")
	case -0.1:
		analysisResults = append(analysisResults, "frustrated")
	case -0.2:
		analysisResults = append(analysisResults, "angry")
	case -0.3:
		analysisResults = append(analysisResults, "pissed")
	case -0.4:
		analysisResults = append(analysisResults, "mad")
	case -0.5:
		analysisResults = append(analysisResults, "outraged")
	case -0.6:
		analysisResults = append(analysisResults, "furious")
	case -0.7:
		analysisResults = append(analysisResults, "furious")
	case -0.8:
		analysisResults = append(analysisResults, "furious")
	case -0.9:
		analysisResults = append(analysisResults, "furious")
	}

	return analysisStrings{OverallSentiment: analysisResults[0], OverallSentimentAdjective: analysisResults[1]}
}

func serveToWeb(tweets []Tweet, positiveTweets int, negativeTweets int) {
	data := data{
		tweets,
	}

	templateData := map[string]interface{}{
		"Tweets":         data.tweets,
		"Date":           getCurrentDate(),
		"TweetCount":     countTweets(tweets),
		"PositiveTweets": positiveTweets,
		"NegativeTweets": negativeTweets,
	}

	fs := http.FileServer(http.Dir("public"))
	http.Handle("/public/", http.StripPrefix("/public/", fs))

	tmpl, _ := template.ParseFiles("templates/layout.html")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl.ExecuteTemplate(w, "index", templateData)
	})

	http.ListenAndServe(":8080", nil)
}

func main() {

	downloadTweets()

	tweets := getTweets()
	positiveTweets, negativeTweets := analyzeSentimentSingle(tweets)

	serveToWeb(tweets, positiveTweets, negativeTweets)

}
