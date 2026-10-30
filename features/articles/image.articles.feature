Feature: As the author of the blog I want to give my articles a cover image

  Scenario: As a visitor I see in the list which articles have a cover image
    Given I use seed data
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And item 1 of the response body should contain:
      """
      {
        "id": "5e1f0a2b-0005-4000-8000-000000000005",
        "title": "Scenarios are documentation that runs",
        "content": "A Gherkin scenario describes behaviour in plain words and then checks it against the running app. When the words and the app disagree, the test fails.",
        "publishedAt": "2025-04-02T08:15:00.000Z",
        "imageId": null,
        "imageUrl": null
      }
      """
    And item 5 of the response body should contain:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "title": "Hello, world: why I started this blog",
        "content": "I want a place to write down what I learn while building software. Notes are easier to remember when someone else could read them, so this blog is my notebook made public.",
        "publishedAt": "2025-01-10T09:00:00.000Z",
        "imageId": "1ae9e000-0001-4000-8000-000000000001",
        "imageUrl": "@image_url(1ae9e000-0001-4000-8000-000000000001)"
      }
      """

  Scenario: As a visitor I open the cover image of an article from the address in the article
    Given I use seed data
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001"
    And I download the file at the "imageUrl" of the response
    Then the response status should be 200
    And the response header "content-type" should be "image/png"
    And the response body should be identical to the file "pixel.png"

  Scenario: As the author I create an article with a cover image
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "An article with a picture",
        "content": "The text of my new article.",
        "imageId": "1ae9e000-0002-4000-8000-000000000002"
      }
      """
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "title": "An article with a picture",
        "content": "The text of my new article.",
        "publishedAt": "@date('within 1 minute from now')",
        "imageId": "1ae9e000-0002-4000-8000-000000000002",
        "imageUrl": "@image_url(1ae9e000-0002-4000-8000-000000000002)"
      }
      """
    When I remember the "id" of the response
    And I send a "GET" request to "/api/v1/articles/@remembered"
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "title": "An article with a picture",
        "content": "The text of my new article.",
        "publishedAt": "@date('within 1 minute from now')",
        "imageId": "1ae9e000-0002-4000-8000-000000000002",
        "imageUrl": "@image_url(1ae9e000-0002-4000-8000-000000000002)"
      }
      """

  Scenario: As the author I upload an image and use it at once as the cover image of a new article
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | file  | pixel.jpg |
    And I remember the "id" of the response
    And I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "My own picture",
        "content": "A picture that I uploaded a moment ago.",
        "imageId": "@remembered"
      }
      """
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "title": "My own picture",
        "content": "A picture that I uploaded a moment ago.",
        "publishedAt": "@date('within 1 minute from now')",
        "imageId": "@uuid",
        "imageUrl": "@image_url"
      }
      """
    When I use no token
    And I download the file at the "imageUrl" of the response
    Then the response status should be 200
    And the response header "content-type" should be "image/jpeg"
    And the response body should be identical to the file "pixel.jpg"

  Scenario: As the author I can give two articles the same cover image
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "Another article about the start",
        "content": "It shares its picture with the first article.",
        "imageId": "1ae9e000-0001-4000-8000-000000000001"
      }
      """
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "title": "Another article about the start",
        "content": "It shares its picture with the first article.",
        "publishedAt": "@date('within 1 minute from now')",
        "imageId": "1ae9e000-0001-4000-8000-000000000001",
        "imageUrl": "@image_url(1ae9e000-0001-4000-8000-000000000001)"
      }
      """

  Scenario: As the author I can say that a new article has no cover image by sending null
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "An article without a picture",
        "content": "The text of my new article.",
        "imageId": null
      }
      """
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "title": "An article without a picture",
        "content": "The text of my new article.",
        "publishedAt": "@date('within 1 minute from now')",
        "imageId": null,
        "imageUrl": null
      }
      """

  Scenario: As the author I am told when the cover image of a new article does not exist
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "An article with a missing picture",
        "content": "The text of my new article.",
        "imageId": "1ae9e000-0001-4000-8000-0000000000ff"
      }
      """
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "statusCode": 400,
        "message": "Request validation failed.",
        "error": "Bad Request",
        "violations": {
          "imageId": ["Image with id 1ae9e000-0001-4000-8000-0000000000ff does not exist."]
        }
      }
      """
    When I send a "GET" request to "/api/v1/articles"
    Then the response body should have 5 items

  Scenario: As the author I am told when the ID of the cover image is not a valid ID
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "An article with a broken picture ID",
        "content": "The text of my new article.",
        "imageId": "not-an-id"
      }
      """
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "statusCode": 400,
        "message": "Request validation failed.",
        "error": "Bad Request",
        "violations": {
          "imageId": ["imageId must be a UUID"]
        }
      }
      """

  Scenario: As the author I give an existing article a cover image and nothing else changes
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "imageId": "1ae9e000-0003-4000-8000-000000000003"
      }
      """
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0002-4000-8000-000000000002",
        "title": "My first month with Docker",
        "content": "Everything in this project runs in containers, including npm. It felt strange for a week and then I stopped caring about which Node.js version is on my laptop.",
        "publishedAt": "2025-02-14T12:30:00.000Z",
        "imageId": "1ae9e000-0003-4000-8000-000000000003",
        "imageUrl": "@image_url(1ae9e000-0003-4000-8000-000000000003)"
      }
      """

  Scenario: As the author I replace the cover image of an article
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001" with body:
      """
      {
        "imageId": "1ae9e000-0004-4000-8000-000000000004"
      }
      """
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "title": "Hello, world: why I started this blog",
        "content": "I want a place to write down what I learn while building software. Notes are easier to remember when someone else could read them, so this blog is my notebook made public.",
        "publishedAt": "2025-01-10T09:00:00.000Z",
        "imageId": "1ae9e000-0004-4000-8000-000000000004",
        "imageUrl": "@image_url(1ae9e000-0004-4000-8000-000000000004)"
      }
      """

  Scenario: As the author I remove the cover image of an article by sending null and the image itself stays
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001" with body:
      """
      {
        "imageId": null
      }
      """
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "title": "Hello, world: why I started this blog",
        "content": "I want a place to write down what I learn while building software. Notes are easier to remember when someone else could read them, so this blog is my notebook made public.",
        "publishedAt": "2025-01-10T09:00:00.000Z",
        "imageId": null,
        "imageUrl": null
      }
      """
    When I download "/api/v1/images/1ae9e000-0001-4000-8000-000000000001"
    Then the response status should be 200

  Scenario: As the author I keep the cover image of an article when I change only its title
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001" with body:
      """
      {
        "title": "A new title"
      }
      """
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "title": "A new title",
        "content": "I want a place to write down what I learn while building software. Notes are easier to remember when someone else could read them, so this blog is my notebook made public.",
        "publishedAt": "2025-01-10T09:00:00.000Z",
        "imageId": "1ae9e000-0001-4000-8000-000000000001",
        "imageUrl": "@image_url(1ae9e000-0001-4000-8000-000000000001)"
      }
      """

  Scenario: As the author I am told when the new cover image of an article does not exist and the article stays as it was
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001" with body:
      """
      {
        "title": "A new title",
        "imageId": "1ae9e000-0001-4000-8000-0000000000ff"
      }
      """
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "statusCode": 400,
        "message": "Request validation failed.",
        "error": "Bad Request",
        "violations": {
          "imageId": ["Image with id 1ae9e000-0001-4000-8000-0000000000ff does not exist."]
        }
      }
      """
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001"
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "title": "Hello, world: why I started this blog",
        "content": "I want a place to write down what I learn while building software. Notes are easier to remember when someone else could read them, so this blog is my notebook made public.",
        "publishedAt": "2025-01-10T09:00:00.000Z",
        "imageId": "1ae9e000-0001-4000-8000-000000000001",
        "imageUrl": "@image_url(1ae9e000-0001-4000-8000-000000000001)"
      }
      """

  Scenario: As the author I am told when the ID of the new cover image of an article is not a valid ID
    Given I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001" with body:
      """
      {
        "imageId": "not-an-id"
      }
      """
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "statusCode": 400,
        "message": "Request validation failed.",
        "error": "Bad Request",
        "violations": {
          "imageId": ["imageId must be a UUID"]
        }
      }
      """

  Scenario: As the author I delete the cover image of an article and the article stays without a cover image
    Given I use seed data
    And I use admin token
    When I send a "DELETE" request to "/api/v1/images/1ae9e000-0001-4000-8000-000000000001"
    Then the response status should be 204
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001"
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "title": "Hello, world: why I started this blog",
        "content": "I want a place to write down what I learn while building software. Notes are easier to remember when someone else could read them, so this blog is my notebook made public.",
        "publishedAt": "2025-01-10T09:00:00.000Z",
        "imageId": null,
        "imageUrl": null
      }
      """

  Scenario: As the author I delete an article and its cover image stays
    Given I use seed data
    And I use admin token
    When I send a "DELETE" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001"
    Then the response status should be 204
    When I download "/api/v1/images/1ae9e000-0001-4000-8000-000000000001"
    Then the response status should be 200
    And the response body should be identical to the file "pixel.png"

  Scenario: As a stranger without a token I cannot give an article a cover image
    Given I use seed data
    And I use no token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "imageId": "1ae9e000-0003-4000-8000-000000000003"
      }
      """
    Then the response status should be 401
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002"
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0002-4000-8000-000000000002",
        "title": "My first month with Docker",
        "content": "Everything in this project runs in containers, including npm. It felt strange for a week and then I stopped caring about which Node.js version is on my laptop.",
        "publishedAt": "2025-02-14T12:30:00.000Z",
        "imageId": null,
        "imageUrl": null
      }
      """
