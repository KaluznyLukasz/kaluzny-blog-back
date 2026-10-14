Feature: As a visitor of the about me page I want to see the list of blog articles

  Scenario: As a visitor I see every article, newest first
    Given I use seed data
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And the response body should list articles in this order:
      | Scenarios are documentation that runs |
      | A migration is a file with SQL        |
      | Reads and writes are different jobs   |
      | My first month with Docker            |
      | Hello, world: why I started this blog |

  Scenario: As a visitor I see articles published at the same moment in the same order on every visit
    Given I use seed data
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And the response body should list articles in this order:
      | Scenarios are documentation that runs |
      | A migration is a file with SQL        |
      | Reads and writes are different jobs   |
      | My first month with Docker            |
      | Hello, world: why I started this blog |
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And the response body should list articles in this order:
      | Scenarios are documentation that runs |
      | A migration is a file with SQL        |
      | Reads and writes are different jobs   |
      | My first month with Docker            |
      | Hello, world: why I started this blog |

  Scenario: As a visitor I see an empty list when there are no articles
    Given I use an empty database
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And the response body should contain:
      """
      []
      """

  Scenario: As a visitor I see each seed article only once after the app restarts several times
    Given I use seed data
    And the database is migrated and seeded 3 more times
    When I send a "GET" request to "/api/v1/articles"
    Then the response status should be 200
    And the response body should have 5 items
