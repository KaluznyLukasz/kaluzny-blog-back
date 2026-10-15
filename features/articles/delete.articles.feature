Feature: As the author of the blog I want to delete my articles through the API

  Scenario: As the author I delete an article and then I cannot read it anymore
    Given I use seed data
    And I use admin token
    When I send a "DELETE" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002"
    Then the response status should be 204
    And the response body should be empty
    When I send a "GET" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002"
    Then the response status should be 404
    And the response body should contain:
      """
      {
        "message": "Article with id 5e1f0a2b-0002-4000-8000-000000000002 does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And the response body should list articles in this order:
      | Scenarios are documentation that runs |
      | A migration is a file with SQL        |
      | Reads and writes are different jobs   |
      | Hello, world: why I started this blog |

  Scenario: As the author I am told when the article I want to delete does not exist
    Given I use admin token
    When I send a "DELETE" request to "/api/v1/articles/5e1f0a2b-0001-4000-8000-0000000000ff"
    Then the response status should be 404
    And the response body should contain:
      """
      {
        "message": "Article with id 5e1f0a2b-0001-4000-8000-0000000000ff does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: As the author I am told when the ID of the article I want to delete is not a valid ID
    Given I use admin token
    When I send a "DELETE" request to "/api/v1/articles/not-an-id"
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As a stranger without a token I cannot delete an article
    Given I use seed data
    And I use no token
    When I send a "DELETE" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002"
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

  Scenario: As a stranger with a wrong token I cannot delete an article
    Given I use seed data
    And I use a wrong token
    When I send a "DELETE" request to "/api/v1/articles/5e1f0a2b-0002-4000-8000-000000000002"
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

  Scenario: As a stranger without a token I learn nothing about which articles exist when I delete with an invalid ID
    Given I use no token
    When I send a "DELETE" request to "/api/v1/articles/not-an-id"
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """
