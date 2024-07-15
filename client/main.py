import requests

from secret import TOKEN

url = "https://chat.eliaslundell.se"

message = input("Message: ")

ret = requests.post(url + "/post", json = {"token": TOKEN, "message": message})

print(ret.text)

ret = requests.get(url + "/posts", params = {"page": 0, "pageSize": 10})
print(ret.text)

if input("delete y/n?") != "y":
    exit()

i = input("id: ")

ret = requests.delete(url + '/post', json = {"token": TOKEN, "id": i})

print(ret)
