Feature: As the author of the blog I want to delete images through the API

  Scenario: As the author I delete an image and then nobody can open it anymore
    Given I use seed data
    And I use admin token
    When I send a "DELETE" request to "/api/v1/images/1ae9e000-0002-4000-8000-000000000002"
    Then the response status should be 204
    And the response body should be empty
    When I use no token
    And I download "/api/v1/images/1ae9e000-0002-4000-8000-000000000002"
    Then the response status should be 404
    And the response body should contain:
      """
      {
        "message": "Image with id 1ae9e000-0002-4000-8000-000000000002 does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """
    When I use admin token
    And I send a "GET" request to "/api/v1/images"
    Then the response status should be 200
    And the response body should have 3 items

  Scenario: As the author I upload an image and delete it using the ID from the answer
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | file  | pixel.png |
    And I remember the "id" of the response
    And I send a "DELETE" request to "/api/v1/images/@remembered"
    Then the response status should be 204
    When I send a "DELETE" request to "/api/v1/images/@remembered"
    Then the response status should be 404

  Scenario: As the author I am told when the image I want to delete does not exist
    Given I use admin token
    When I send a "DELETE" request to "/api/v1/images/1ae9e000-0001-4000-8000-0000000000ff"
    Then the response status should be 404
    And the response body should contain:
      """
      {
        "message": "Image with id 1ae9e000-0001-4000-8000-0000000000ff does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: As the author I am told when the ID of the image I want to delete is not a valid ID
    Given I use admin token
    When I send a "DELETE" request to "/api/v1/images/not-an-id"
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As a stranger without a token I cannot delete an image
    Given I use seed data
    And I use no token
    When I send a "DELETE" request to "/api/v1/images/1ae9e000-0002-4000-8000-000000000002"
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """
    When I download "/api/v1/images/1ae9e000-0002-4000-8000-000000000002"
    Then the response status should be 200

  Scenario: As a stranger with a wrong token I cannot delete an image
    Given I use seed data
    And I use a wrong token
    When I send a "DELETE" request to "/api/v1/images/1ae9e000-0002-4000-8000-000000000002"
    Then the response status should be 403
    And the response body should contain:
      """
      {
        "message": "Forbidden resource",
        "error": "Forbidden",
        "statusCode": 403
      }
      """
    When I download "/api/v1/images/1ae9e000-0002-4000-8000-000000000002"
    Then the response status should be 200

  Scenario: As a stranger without a token I learn nothing about which images exist when I delete with an invalid ID
    Given I use no token
    When I send a "DELETE" request to "/api/v1/images/not-an-id"
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """
