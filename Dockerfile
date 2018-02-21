From golang:latest

RUN go get cloud.google.com/go/language/apiv1
RUN go get golang.org/x/net/context
RUN go get google.golang.org/genproto/googleapis/cloud/language/v1

COPY ./tweets/tweets.json ./tweets/tweets.json

ADD . /go/src/github.com/tjaensch/trutter

RUN go install github.com/tjaensch/trutter

ENTRYPOINT /go/bin/trutter

EXPOSE 8080