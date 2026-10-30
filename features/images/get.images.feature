Feature: As a visitor of the blog I want to open the images of the articles

  Scenario: As a visitor without a token I open an image and I may keep it for a long time
    Given I use seed data
    And I use no token
    When I download "/api/v1/images/1ae9e000-0001-4000-8000-000000000001"
    Then the response status should be 200
    And the response header "content-type" should be "image/png"
    And the response header "content-length" should be "70"
    And the response header "cache-control" should be "public, max-age=31536000, immutable"
    And the response header "x-content-type-options" should be "nosniff"
    And the response body should be identical to the file "pixel.png"

  Scenario Outline: As a visitor I open a <type> image with its own type
    Given I use seed data
    When I download "/api/v1/images/<id>"
    Then the response status should be 200
    And the response header "content-type" should be "<type>"
    And the response body should be identical to the file "<file>"

    Examples:
      | id                                   | type       | file       |
      | 1ae9e000-0001-4000-8000-000000000001 | image/png  | pixel.png  |
      | 1ae9e000-0002-4000-8000-000000000002 | image/gif  | pixel.gif  |
      | 1ae9e000-0003-4000-8000-000000000003 | image/webp | pixel.webp |
      | 1ae9e000-0004-4000-8000-000000000004 | image/jpeg | pixel.jpg  |

  Scenario: As a visitor I am told when the image does not exist and the answer is not kept
    Given I use seed data
    When I download "/api/v1/images/1ae9e000-0001-4000-8000-0000000000ff"
    Then the response status should be 404
    And the response body should contain:
      """
      {
        "message": "Image with id 1ae9e000-0001-4000-8000-0000000000ff does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """
    And the response should not have the header "cache-control"

  Scenario: As a visitor I am told when the ID of the image is not a valid ID
    When I download "/api/v1/images/not-an-id"
    Then the response status should be 400
    And the response body should contain:
      """
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """
    And the response should not have the header "cache-control"
