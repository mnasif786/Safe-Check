require 'rubygems'
require 'capybara'
require 'capybara/dsl'

include Capybara::DSL

Capybara.run_server = false
Capybara.current_driver = :selenium
Capybara.app_host = 'http://pbs42691:8107'

visit '/Angular/Tests/SpecRunner.html'

raise 'Jasmine tests failed' unless page.has_selector?('span.passingAlert')