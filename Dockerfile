From golang:latest
ADD . /go/src/github.com/tjaensch/trutter

RUN go install github.com/tjaensch/trutter

ENTRYPOINT /go/bin/trutter

EXPOSE 8080