FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY VaultTrade.slnx ./
COPY src/VaultTrade.Domain/VaultTrade.Domain.csproj src/VaultTrade.Domain/
COPY src/VaultTrade.Application/VaultTrade.Application.csproj src/VaultTrade.Application/
COPY src/VaultTrade.Infrastructure/VaultTrade.Infrastructure.csproj src/VaultTrade.Infrastructure/
COPY src/VaultTrade.API/VaultTrade.API.csproj src/VaultTrade.API/

RUN dotnet restore src/VaultTrade.API/VaultTrade.API.csproj

COPY src/ src/
RUN dotnet publish src/VaultTrade.API/VaultTrade.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "VaultTrade.API.dll"]
