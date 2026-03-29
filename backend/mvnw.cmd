@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET "BASE_DIR=%~dp0") ELSE (SET "BASE_DIR=%__MVNW_ARG0_NAME__%")
@SET MAVEN_PROJECTBASEDIR=%BASE_DIR%
@SET JAVA_HOME=C:\Program Files\Java\jdk-17
@SET PATH=%JAVA_HOME%\bin;%PATH%

@SET WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
@SET DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

@SET MVN_CMD="%JAVA_HOME%\bin\java" -jar %WRAPPER_JAR%

@IF NOT EXIST %WRAPPER_JAR% (
  @ECHO Downloading Maven Wrapper JAR...
  @powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar' }"
)

@SET MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6
@IF NOT EXIST "%MAVEN_HOME%" (
  @ECHO Downloading Apache Maven 3.9.6...
  @powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $zip = '%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6.zip'; New-Item -ItemType Directory -Force -Path '%USERPROFILE%\.m2\wrapper\dists' | Out-Null; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip' -OutFile $zip; Expand-Archive -Path $zip -DestinationPath '%USERPROFILE%\.m2\wrapper\dists' -Force }"
)

@SET PATH=%MAVEN_HOME%\apache-maven-3.9.6\bin;%PATH%
@IF EXIST "%MAVEN_HOME%\apache-maven-3.9.6\bin\mvn.cmd" (
  SET "MAVEN_CMD=%MAVEN_HOME%\apache-maven-3.9.6\bin\mvn.cmd"
) ELSE (
  SET "MAVEN_CMD=%MAVEN_HOME%\bin\mvn.cmd"
)

@"%JAVA_HOME%\bin\java" -jar %WRAPPER_JAR% %*
