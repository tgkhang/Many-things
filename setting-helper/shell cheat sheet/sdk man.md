 Temporary Switch (Current Shell Only)

  sdk use java 21.0.1-tem        # Switch Java to version 21
  sdk use gradle 8.5             # Switch Gradle to version 8.5
  sdk use maven 3.9.6            # Switch Maven to version 3.9.6
  This only affects your current terminal session

  Permanent Switch (Set as Default)

  sdk default java 21.0.1-tem    # Set Java 21 as default for all new shells
  sdk default gradle 8.5         # Set Gradle 8.5 as default
  sdk default maven 3.9.6        # Set Maven 3.9.6 as default
  This sets the version as default for all future terminal sessions

  Check Current Versions

  sdk current                    # Show all current versions in use
  sdk current java               # Show only current Java version
  java -version                  # Verify Java version directly

  Example Workflow: Managing Multiple Java Versions

# 1. List installed Java versions

  sdk list java

# Output example

# ✓ 21.0.1-tem     ← Currently default and in use

# * 17.0.9-tem     ← Installed but not default

# * 11.0.21-tem    ← Installed but not default

# 2. Switch to Java 17 for current terminal

  sdk use java 17.0.9-tem

# 3. Verify the switch

  java -version

# Output: openjdk version "17.0.9"

# 4. Make Java 17 the default for all terminals

  sdk default java 17.0.9-tem

# 5. In another project, temporarily use Java 11

  sdk use java 11.0.21-tem

  Project-Specific Versions

  Create a .sdkmanrc file in your project directory:

# .sdkmanrc

  java=21.0.1-tem
  gradle=8.5
  maven=3.9.6

  Then use:
  sdk env install    # Install all versions listed in .sdkmanrc
  sdk env            # Switch to versions specified in .sdkmanrc

  Quick Switch Between Two Versions

# Switch to Java 21

  sdk use java 21.0.1-tem

# Do work

# Switch back to Java 17

  sdk use java 17.0.9-tem

# Do work

# Check what's available to switch to

  sdk list java | grep installed

  Understanding the Status Symbols

  When you run sdk list java:
  >
- > = Currently in use in this shell
- - = Installed but not currently in use
- ✓ = Default version (used in new shells)
- No symbol = Available to install but not installed

  Practical Example: Working on Multiple Projects

# Project A needs Java 21

  cd ~/project-a
  sdk use java 21.0.1-tem
  sdk use gradle 8.5

# Project B needs Java 17

  cd ~/project-b
  sdk use java 17.0.9-tem
  sdk use gradle 7.6

# Check what you're using

  sdk current

  The key difference:

- sdk use = temporary (this terminal only)
- sdk default = permanent (all future terminals)
