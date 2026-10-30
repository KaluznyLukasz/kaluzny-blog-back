Feature: As the author of the blog I want to edit my articles through the API

  Scenario: As the author I change the title and the text of an article and its publication date stays the same
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": "Docker after a year",
        "content": "Containers are now my default way to run any project."
      }
      """
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0002-4000-8000-000000000002",
        "title": "Docker after a year",
        "content": "Containers are now my default way to run any project.",
        "publishedAt": "2025-02-14T12:30:00.000Z",
        "imageId": null,
        "imageUrl": null
      }
      """
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002"
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0002-4000-8000-000000000002",
        "title": "Docker after a year",
        "content": "Containers are now my default way to run any project.",
        "publishedAt": "2025-02-14T12:30:00.000Z",
        "imageId": null,
        "imageUrl": null
      }
      """

  Scenario: As the author I change only the title of an article and the text stays the same
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": "Docker after a year"
      }
      """
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0002-4000-8000-000000000002",
        "title": "Docker after a year",
        "content": "Everything in this project runs in containers, including npm. It felt strange for a week and then I stopped caring about which Node.js version is on my laptop.",
        "publishedAt": "2025-02-14T12:30:00.000Z",
        "imageId": null,
        "imageUrl": null
      }
      """

  Scenario: As the author I change nothing when I send an edit without fields
    Given I use seed data
    And I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {}
      """
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

  Scenario: As the author I am told which fields are too short when I edit an article
    Given I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": "ab",
        "content": "short"
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
          "title": ["title must be longer than or equal to 3 characters"],
          "content": ["content must be longer than or equal to 10 characters"]
        }
      }
      """

  Scenario: As the author I am told which fields are too long when I edit an article
    Given I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": "@characters(256)",
        "content": "@characters(20001)"
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
          "title": ["title must be shorter than or equal to 255 characters"],
          "content": ["content must be shorter than or equal to 20000 characters"]
        }
      }
      """

  Scenario: As the author I cannot empty a field of an article by sending null
    Given I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": null
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
          "title": [
            "title must be a string",
            "title must be longer than or equal to 3 characters",
            "title must be shorter than or equal to 255 characters"
          ]
        }
      }
      """

  Scenario: As the author I cannot change the ID or the publication date of an article, or add unknown fields
    Given I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "publishedAt": "2020-01-01T00:00:00.000Z",
        "author": "me"
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
          "id": ["property id should not exist"],
          "publishedAt": ["property publishedAt should not exist"],
          "author": ["property author should not exist"]
        }
      }
      """

  Scenario: As the author I am told when the article I want to edit does not exist
    Given I use admin token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-0000000000ff" with body:
      """
      {
        "title": "Docker after a year"
      }
      """
    Then the response status should be 404
    And the response body should contain:
      """
      {
        "message": "Article with id 5e1f0a2b-0001-4000-8000-0000000000ff does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: As the author I am told when the ID of the article I want to edit is not a valid ID
    Given I use admin token
    When I send a "PATCH" request to "/api/v1/articles/not-an-id" with body:
      """
      {
        "title": "Docker after a year"
      }
      """
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As a stranger without a token I cannot edit an article
    Given I use seed data
    And I use no token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": "Docker after a year"
      }
      """
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """
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

  Scenario: As a stranger with a wrong token I cannot edit an article
    Given I use seed data
    And I use a wrong token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": "Docker after a year"
      }
      """
    Then the response status should be 403
    And the response body should contain:
      """
      {
        "message": "Forbidden resource",
        "error": "Forbidden",
        "statusCode": 403
      }
      """
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

  Scenario: As a stranger without a token I learn nothing about the rules when I edit an article with invalid data
    Given I use no token
    When I send a "PATCH" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002" with body:
      """
      {
        "title": "ab"
      }
      """
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """

  Scenario: As a stranger without a token I learn nothing about which articles exist when I edit with an invalid ID
    Given I use no token
    When I send a "PATCH" request to "/api/v1/articles/not-an-id" with body:
      """
      {
        "title": "Docker after a year"
      }
      """
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """
