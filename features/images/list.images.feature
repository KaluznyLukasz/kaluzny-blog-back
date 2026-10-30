Feature: As the author of the blog I want to see the images I uploaded

  Scenario: As the author I see all images, newest first, with the address of each one
    Given I use seed data
    And I use admin token
    When I send a "GET" request to "/api/v1/images"
    Then the response status should be 200
    And the response body should contain:
      """
      [
        {
          "id": "1ae9e000-0003-4000-8000-000000000003",
          "contentType": "image/webp",
          "size": 34,
          "uploadedAt": "2025-03-20T18:00:00.000Z",
          "url": "@image_url(1ae9e000-0003-4000-8000-000000000003)"
        },
        {
          "id": "1ae9e000-0004-4000-8000-000000000004",
          "contentType": "image/jpeg",
          "size": 134,
          "uploadedAt": "2025-03-20T18:00:00.000Z",
          "url": "@image_url(1ae9e000-0004-4000-8000-000000000004)"
        },
        {
          "id": "1ae9e000-0002-4000-8000-000000000002",
          "contentType": "image/gif",
          "size": 42,
          "uploadedAt": "2025-02-14T12:30:00.000Z",
          "url": "@image_url(1ae9e000-0002-4000-8000-000000000002)"
        },
        {
          "id": "1ae9e000-0001-4000-8000-000000000001",
          "contentType": "image/png",
          "size": 70,
          "uploadedAt": "2025-01-10T09:00:00.000Z",
          "url": "@image_url(1ae9e000-0001-4000-8000-000000000001)"
        }
      ]
      """

  Scenario: As the author I see an empty list when I have not uploaded any image
    Given I use an empty database
    And I use admin token
    When I send a "GET" request to "/api/v1/images"
    Then the response status should be 200
    And the response body should have 0 items

  Scenario: As a stranger without a token I cannot list the images
    Given I use no token
    When I send a "GET" request to "/api/v1/images"
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """

  Scenario: As a stranger with a wrong token I cannot list the images
    Given I use a wrong token
    When I send a "GET" request to "/api/v1/images"
    Then the response status should be 403
    And the response body should contain:
      """
      {
        "message": "Forbidden resource",
        "error": "Forbidden",
        "statusCode": 403
      }
      """
