require 'yaml'
require 'sinatra/base'
require 'data_mapper'
require 'dm-postgres-adapter'
require 'fileutils'

class MetricServer < Sinatra::Base
  attr_accessor :metrics, :avg, :error, :builds, :last_sat, :next_sat, :title

  #  =============================  METHODS  =============================== #
  # Determine if a configuration file is present and return its location if it does
  def self.config_file
    ["/etc/metrics/db.conf", "#{File.dirname(__FILE__)}/conf/db.conf"].each do |config|
      return config if File.exists?(config)
    end
    nil
  end

  # Returns timestamps for both last Saturday and next Saturady, allowing for easy
  # weekly stats
  def get_saturdays
    today = Time.now
    @next_sat = today.dup
    while not @next_sat.saturday?
      @next_sat += 86400
    end
    @next_sat = Time.mktime(@next_sat.year, @next_sat.month, @next_sat.day) + 86399

    @last_sat = today.dup
    while not @last_sat.saturday?
      @last_sat -= 86400
    end
    @last_sat = Time.mktime(@last_sat.year, @last_sat.month, @last_sat.day)
  end

  # Yields to the provided block if a configuration file is present, or throws
  # an error if it is not
  def render_page(*args, &block)
    if @@configured == true
      yield block
    else
      puts "(Temporary error): no configuration file present, and no DB could be reached"
    end
  end

  config = YAML.load_file(config_file) if config_file

  if config
    @@configured = true
    DataMapper::Logger.new($stdout, :debug)
    config_string = "postgres://#{config['username']}:#{config['password']}@#{config['hostname']}#{config.has_key?('port') ? ":#{config['port']}" : ""}/#{config['database']}"
    DataMapper.setup(:default, config_string)
    require "#{File.dirname(__FILE__)}/models/metric"
  else
    @@configured = false
  end

  #  =============================  ROUTES  =============================== #

  get '/overview' do
    erb :overview
  end

  # Listener for incoming metrics. Stores the data in the metrics database
  # Expects a hash with the following keys:
  #
  #
  post '/overview/metrics' do
    # Format some paramters and download the Jenkins build log for storage
    params[:date]       = Time.now.to_s
    params[:success] = case params[:success]
        when /SUCCESS/ then true
        when /true/    then true
        else false
    end
    params[:build_log] = `wget -q #{params[:build_log]} -O -` if params[:jenkins_build_time] != nil
    params[:package_build_time] = nil if params[:package_build_time] == "N/A"
#=begin
    puts "\n\n\n"
    puts params.inspect
    puts params[:date]
    puts params[:package_name]
    puts params[:dist]
    puts params[:jenkins_build_time]
    puts params[:package_build_time]
    puts params[:build_user]
    puts params[:build_loc]
    puts params[:version]
    puts params[:pe_version]
    puts params[:success]
    puts params[:build_log]
#=end
    render_page do
      begin
        Metric.create( params )
        200
      rescue Exception => e
        puts "something went wrong\n\n\n"
        [418, "#{e.message} AND #{params.inspect}"]
      end
    end
  end

  # Start the server if this file is executed directly
  run! if app_file == $0
end
