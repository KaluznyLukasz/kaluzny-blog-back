Feature: As the author of the blog I want to create articles through the API

  Scenario: As the author I create an article and then I see it first in the list
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "  My new article  ",
        "content": "The text of my new article."
      }
      """
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "title": "My new article",
        "content": "The text of my new article.",
        "publishedAt": "@date('within 1 minute from now')",
        "imageId": null,
        "imageUrl": null
      }
      """
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And the response body should list articles in this order:
      | My new article                        |
      | Scenarios are documentation that runs |
      | A migration is a file with SQL        |
      | Reads and writes are different jobs   |
      | My first month with Docker            |
      | Hello, world: why I started this blog |

  Scenario: As the author I can create an article with the shortest title and the shortest text
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "abc",
        "content": "abcdefghij"
      }
      """
    Then the response status should be 201

  Scenario: As the author I can create an article with the longest title and the longest text
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "@characters(255)",
        "content": "@characters(20000)"
      }
      """
    Then the response status should be 201

  Scenario: As the author I am told which fields are too short when I create an article
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
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

  Scenario: As the author I am told which fields are too long when I create an article
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
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

  Scenario: As the author I cannot create an article with a title made only of spaces
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "     ",
        "content": "The text of my new article."
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
          "title": ["title must be longer than or equal to 3 characters"]
        }
      }
      """

  Scenario: As the author I am told about every missing field when I create an article
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {}
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
          ],
          "content": [
            "content must be a string",
            "content must be longer than or equal to 10 characters",
            "content must be shorter than or equal to 20000 characters"
          ]
        }
      }
      """

  Scenario: As the author I cannot choose the ID or the publication date of a new article
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "publishedAt": "2020-01-01T00:00:00.000Z",
        "title": "My new article",
        "content": "The text of my new article."
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
          "publishedAt": ["property publishedAt should not exist"]
        }
      }
      """

  Scenario: As the author I cannot create an article with an unknown field
    Given I use admin token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "My new article",
        "content": "The text of my new article.",
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
          "author": ["property author should not exist"]
        }
      }
      """

  Scenario: As a stranger without a token I cannot create an article
    Given I use seed data
    And I use no token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "My new article",
        "content": "The text of my new article."
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
    When I send a "GET" request to "/api/v1/articles"
    Then the response body should have 5 items

  Scenario: As a stranger with a wrong token I cannot create an article
    Given I use seed data
    And I use a wrong token
    When I send a "POST" request to "/api/v1/articles" with body:
      """
      {
        "title": "My new article",
        "content": "The text of my new article."
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
    When I send a "GET" request to "/api/v1/articles"
    Then the response body should have 5 items

  Scenario: As a stranger without a token I learn nothing about the rules when I create an article with invalid data
    Given I use no token
    When I send a "POST" request to "/api/v1/articles" with body:
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
