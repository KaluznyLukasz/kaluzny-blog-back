Feature: As a visitor of the about me page I want to read one blog article

  Scenario: As a visitor without a token I still read an article
    Given I use seed data
    And I use no token
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001"
    Then the response status should be 200

  Scenario: As a visitor I read an article by its ID
    Given I use seed data
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-000000000001"
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "id": "5e1f0a2b-0001-4000-8000-000000000001",
        "title": "Hello, world: why I started this blog",
        "content": "I want a place to write down what I learn while building software. Notes are easier to remember when someone else could read them, so this blog is my notebook made public.",
        "publishedAt": "2025-01-10T09:00:00.000Z"
      }
      """

  Scenario: As a visitor I am told when the article I asked for does not exist
    Given I use seed data
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-0000000000ff"
    Then the response status should be 404
    And the response body should contain:
      """
      {
        "message": "Article with id 5e1f0a2b-0001-4000-8000-0000000000ff does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: As a visitor I am told when the article ID is not a valid ID
    Given I use seed data
    When I send a "GET" request to "/api/v1/articles/not-an-id"
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """
