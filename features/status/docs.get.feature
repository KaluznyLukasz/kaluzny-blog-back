Feature: As a user I can see API status and version

  Scenario: I see documentation user interface
    When I send a "GET" request to "/"
    Then the response status should be 200
    And the response body should contain:
      """
      {
        "status": "OK",
        "version": "@current_app_version"
      }
      """
