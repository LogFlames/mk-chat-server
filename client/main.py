import requests

from secret import TOKEN

url = "http://localhost:8045/post"

message = input("Message: ")

ret = requests.post(url, json = {"token": TOKEN, "message": message})

print(ret)
