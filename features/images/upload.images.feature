Feature: As the author of the blog I want to upload images through the API

  Scenario: As the author I upload an image, I get its address and I can open the image from that address
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | file  | pixel.png |
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "contentType": "image/png",
        "size": 70,
        "uploadedAt": "@date('within 1 minute from now')",
        "url": "@image_url"
      }
      """
    When I use no token
    And I download the file at the "url" of the response
    Then the response status should be 200
    And the response header "content-type" should be "image/png"
    And the response body should be identical to the file "pixel.png"

  Scenario: As the author I upload an image and then I see it first in the list
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | file  | pixel.gif |
    Then the response status should be 201
    When I send a "GET" request to "/api/v1/images"
    Then the response status should be 200
    And the response body should contain:
      """
      [
        {
          "id": "@uuid",
          "contentType": "image/gif",
          "size": 42,
          "uploadedAt": "@date('within 1 minute from now')",
          "url": "@image_url"
        },
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

  Scenario Outline: As the author I can upload a <type> image and it is served as the same file
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file   |
      | file  | <file> |
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "contentType": "<type>",
        "size": <size>,
        "uploadedAt": "@date('within 1 minute from now')",
        "url": "@image_url"
      }
      """
    When I download the file at the "url" of the response
    Then the response status should be 200
    And the response header "content-type" should be "<type>"
    And the response body should be identical to the file "<file>"

    Examples:
      | file       | type       | size |
      | pixel.png  | image/png  | 70   |
      | pixel.jpg  | image/jpeg | 134  |
      | pixel.gif  | image/gif  | 42   |
      | pixel.webp | image/webp | 34   |

  Scenario: As the author I get the real type of an image even when the file name says something else
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      | name      |
      | file  | pixel.png | notes.txt |
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "contentType": "image/png",
        "size": 70,
        "uploadedAt": "@date('within 1 minute from now')",
        "url": "@image_url"
      }
      """
    When I download the file at the "url" of the response
    Then the response header "content-type" should be "image/png"

  Scenario: As the author I cannot upload a text file that only pretends to be a PNG
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file             |
      | file  | not-an-image.png |
    Then the response status should be 415
    And the response body should contain:
      """
      {
        "message": "The file is not a JPEG, PNG, GIF or WebP image.",
        "error": "Unsupported Media Type",
        "statusCode": 415
      }
      """
    When I send a "GET" request to "/api/v1/images"
    Then the response body should have 4 items

  Scenario: As the author I cannot upload an SVG image because it can carry a script
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file       |
      | file  | vector.svg |
    Then the response status should be 415
    And the response body should contain:
      """
      {
        "message": "The file is not a JPEG, PNG, GIF or WebP image.",
        "error": "Unsupported Media Type",
        "statusCode": 415
      }
      """

  Scenario: As the author I cannot upload an empty file
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      | name      |
      | file  | @bytes(0) | empty.png |
    Then the response status should be 415
    And the response body should contain:
      """
      {
        "message": "The file is not a JPEG, PNG, GIF or WebP image.",
        "error": "Unsupported Media Type",
        "statusCode": 415
      }
      """

  Scenario: As the author I can upload an image of exactly 5 MB
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file            |
      | file  | @image(5242880) |
    Then the response status should be 201
    And the response body should contain:
      """
      {
        "id": "@uuid",
        "contentType": "image/png",
        "size": 5242880,
        "uploadedAt": "@date('within 1 minute from now')",
        "url": "@image_url"
      }
      """
    When I download the file at the "url" of the response
    Then the response status should be 200
    And the response body should have 5242880 bytes

  Scenario: As the author I cannot upload an image that is one byte bigger than 5 MB
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file            |
      | file  | @image(5242881) |
    Then the response status should be 413
    And the response body should contain:
      """
      {
        "message": "File too large",
        "error": "Payload Too Large",
        "statusCode": 413
      }
      """
    When I send a "GET" request to "/api/v1/images"
    Then the response body should have 4 items

  Scenario: As the author I am told when I send no file
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with body:
      """
      {}
      """
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "File is required",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As the author I am told when I send the file in a field with another name
    Given I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | photo | pixel.png |
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "Unexpected field - photo",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As the author I cannot upload two files at once
    Given I use seed data
    And I use admin token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | file  | pixel.png |
      | file  | pixel.gif |
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "Too many files",
        "error": "Bad Request",
        "statusCode": 400
      }
      """
    When I send a "GET" request to "/api/v1/images"
    Then the response body should have 4 items

  Scenario: As a stranger without a token I cannot upload an image
    Given I use seed data
    And I use no token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | file  | pixel.png |
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """
    When I use admin token
    And I send a "GET" request to "/api/v1/images"
    Then the response body should have 4 items

  Scenario: As a stranger with a wrong token I cannot upload an image
    Given I use seed data
    And I use a wrong token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file      |
      | file  | pixel.png |
    Then the response status should be 403
    And the response body should contain:
      """
      {
        "message": "Forbidden resource",
        "error": "Forbidden",
        "statusCode": 403
      }
      """
    When I use admin token
    And I send a "GET" request to "/api/v1/images"
    Then the response body should have 4 items

  Scenario: As a stranger without a token I learn nothing about the rules when I upload an invalid file
    Given I use no token
    When I send a "POST" request to "/api/v1/images" with the multipart form:
      | field | file             |
      | file  | not-an-image.png |
    Then the response status should be 401
    And the response body should contain:
      """
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """
