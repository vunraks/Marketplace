FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src

COPY VaultTrade.slnx ./
COPY src/VaultTrade.Domain/VaultTrade.Domain.csproj src/VaultTrade.Domain/
COPY src/VaultTrade.Application/VaultTrade.Application.csproj src/VaultTrade.Application/
COPY src/VaultTrade.Infrastructure/VaultTrade.Infrastructure.csproj src/VaultTrade.Infrastructure/
COPY src/VaultTrade.API/VaultTrade.API.csproj src/VaultTrade.API/

RUN dotnet restore src/VaultTrade.API/VaultTrade.API.csproj

COPY src/ src/
RUN dotnet publish src/VaultTrade.API/VaultTrade.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS final
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
ENV DOTNET_EnableDiagnostics=0

ENTRYPOINT ["dotnet", "VaultTrade.API.dll"]
