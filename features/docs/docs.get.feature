Feature: As a developer I want to see the documentation

  Scenario: I see documentation user interface
    When I send a "GET" request to "/api"
    Then the response status should be 200

  Scenario: I see documentation in JSON
    When I send a "GET" request to "/api-json"
    Then the response status should be 200
