﻿using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.Tests.TestUtils;
using Microsoft.TeamsAI.Application;
using Newtonsoft.Json;
using Microsoft.Bot.Builder;
using AdaptiveCards;
using Newtonsoft.Json.Linq;

namespace Microsoft.TeamsAI.Tests.Application
{
    public class AdaptiveCardsTests
    {
        [Fact]
        public async void Test_OnActionExecute_Verb_AdaptiveCard()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "adaptiveCard/action",
                Value = JObject.FromObject(new
                {
                    action = new
                    {
                        type = "Action.Execute",
                        verb = "test-verb",
                        data = new
                        {
                            testKey = "test-value"
                        }
                    }
                })
            });
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new AdaptiveCardInvokeResponse()
                {
                    StatusCode = 200,
                    Type = "application/vnd.microsoft.card.adaptive",
                    Value = new AdaptiveCard("1.4")
                    {
                        Body = new List<AdaptiveElement>
                        {
                            new AdaptiveTextBlock("test-value")
                        }
                    }
                }
            };
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            ActionExecuteAdaptiveCardHandler<TestTurnState, TestAdaptiveCardActionData> handler = (ITurnContext turnContext, TestTurnState turnState, TestAdaptiveCardActionData data, CancellationToken cancellationToken) =>
            {
                Assert.Equal("test-value", data.TestKey);
                var adaptiveCard = new AdaptiveCard("1.4")
                {
                    Body = new List<AdaptiveElement>
                    {
                        new AdaptiveTextBlock(data.TestKey)
                    }
                };
                return Task.FromResult(adaptiveCard);
            };

            // Act
            adaptiveCards.OnActionExecute("test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnActionExecute_Verb_AdaptiveCard_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "adaptiveCard/action",
                Value = JObject.FromObject(new
                {
                    action = new
                    {
                        type = "Action.Execute",
                        verb = "test-verb",
                        data = new
                        {
                            testKey = "test-value"
                        }
                    }
                })
            });
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            ActionExecuteAdaptiveCardHandler<TestTurnState, TestAdaptiveCardActionData> handler = (ITurnContext turnContext, TestTurnState turnState, TestAdaptiveCardActionData data, CancellationToken cancellationToken) =>
            {
                Assert.Equal("test-value", data.TestKey);
                var adaptiveCard = new AdaptiveCard("1.4")
                {
                    Body = new List<AdaptiveElement>
                    {
                        new AdaptiveTextBlock(data.TestKey)
                    }
                };
                return Task.FromResult(adaptiveCard);
            };

            // Act
            adaptiveCards.OnActionExecute("not-test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnActionExecute_Verb_Text()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "adaptiveCard/action",
                Value = JObject.FromObject(new
                {
                    action = new
                    {
                        type = "Action.Execute",
                        verb = "test-verb",
                        data = new
                        {
                            testKey = "test-value"
                        }
                    }
                })
            });
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new AdaptiveCardInvokeResponse()
                {
                    StatusCode = 200,
                    Type = "application/vnd.microsoft.activity.message",
                    Value = "test-value"
                }
            };
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            ActionExecuteTextHandler<TestTurnState, TestAdaptiveCardActionData> handler = (ITurnContext turnContext, TestTurnState turnState, TestAdaptiveCardActionData data, CancellationToken cancellationToken) =>
            {
                Assert.Equal("test-value", data.TestKey);
                return Task.FromResult(data.TestKey!);
            };

            // Act
            adaptiveCards.OnActionExecute("test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnActionExecute_Verb_Text_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "adaptiveCard/action",
                Value = JObject.FromObject(new
                {
                    action = new
                    {
                        type = "Action.Execute",
                        verb = "test-verb",
                        data = new
                        {
                            testKey = "test-value"
                        }
                    }
                })
            });
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            ActionExecuteTextHandler<TestTurnState, TestAdaptiveCardActionData> handler = (ITurnContext turnContext, TestTurnState turnState, TestAdaptiveCardActionData data, CancellationToken cancellationToken) =>
            {
                Assert.Equal("test-value", data.TestKey);
                return Task.FromResult(data.TestKey!);
            };

            // Act
            adaptiveCards.OnActionExecute("not-test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnActionSubmit_Verb()
        {
            // Arrange
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Message,
                Value = JObject.FromObject(new
                {
                    verb = "test-verb",
                    testKey = "test-value"
                })
            });
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            var called = false;
            ActionSubmitHandler<TestTurnState, TestAdaptiveCardSubmitData> handler = (ITurnContext turnContext, TestTurnState turnState, TestAdaptiveCardSubmitData data, CancellationToken cancellationToken) =>
            {
                called = true;
                Assert.Equal("test-verb", data.Verb);
                Assert.Equal("test-value", data.TestKey);
                return Task.CompletedTask;
            };

            // Act
            adaptiveCards.OnActionSubmit("test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.True(called);
        }

        [Fact]
        public async void Test_OnActionSubmit_Verb_NotHit()
        {
            // Arrange
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Message,
                Value = JObject.FromObject(new
                {
                    verb = "test-verb",
                    testKey = "test-value"
                })
            });
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            var called = false;
            ActionSubmitHandler<TestTurnState, TestAdaptiveCardSubmitData> handler = (ITurnContext turnContext, TestTurnState turnState, TestAdaptiveCardSubmitData data, CancellationToken cancellationToken) =>
            {
                called = true;
                Assert.Equal("test-verb", data.Verb);
                Assert.Equal("test-value", data.TestKey);
                return Task.CompletedTask;
            };

            // Act
            adaptiveCards.OnActionSubmit("not-test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.False(called);
        }

        [Fact]
        public async void Test_OnSearch_Dataset()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "application/search",
                Value = JObject.FromObject(new
                {
                    kind = "search",
                    queryText = "test-query",
                    queryOptions = new
                    {
                        skip = 0,
                        top = 15
                    },
                    dataset = "test-dataset"
                })
            });
            IList<AdaptiveCardsSearchResult> searchResults = new List<AdaptiveCardsSearchResult>
            {
                new AdaptiveCardsSearchResult("test-title", "test-value")
            };
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new SearchInvokeResponse()
                {
                    StatusCode = 200,
                    Type = "application/vnd.microsoft.search.searchResponse",
                    Value = new
                    {
                        Results = searchResults
                    }
                }
            };
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            SearchHandler<TestTurnState> handler = (ITurnContext turnContext, TestTurnState turnState, Query<AdaptiveCardsSearchParams> query, CancellationToken cancellationToken) =>
            {
                Assert.Equal("test-query", query.Parameters.QueryText);
                Assert.Equal("test-dataset", query.Parameters.Dataset);
                return Task.FromResult(searchResults);
            };

            // Act
            adaptiveCards.OnSearch("test-dataset", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnSearch_Dataset_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "application/search",
                Value = JObject.FromObject(new
                {
                    kind = "search",
                    queryText = "test-query",
                    queryOptions = new
                    {
                        skip = 0,
                        top = 15
                    },
                    dataset = "test-dataset"
                })
            });
            IList<AdaptiveCardsSearchResult> searchResults = new List<AdaptiveCardsSearchResult>
            {
                new AdaptiveCardsSearchResult("test-title", "test-value")
            };
            var app = new TeamsAI.Application.Application<TestTurnState, TestTurnStateManager>(new());
            var adaptiveCards = new AdaptiveCards<TestTurnState, TestTurnStateManager>(app);
            SearchHandler<TestTurnState> handler = (ITurnContext turnContext, TestTurnState turnState, Query<AdaptiveCardsSearchParams> query, CancellationToken cancellationToken) =>
            {
                Assert.Equal("test-query", query.Parameters.QueryText);
                Assert.Equal("test-dataset", query.Parameters.Dataset);
                return Task.FromResult(searchResults);
            };

            // Act
            adaptiveCards.OnSearch("not-test-dataset", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        private class TestAdaptiveCardActionData
        {
            [JsonProperty("testKey")]
            public string? TestKey { get; set; }
        }

        private class TestAdaptiveCardSubmitData
        {
            [JsonProperty("verb")]
            public string? Verb { get; set; }

            [JsonProperty("testKey")]
            public string? TestKey { get; set; }
        }
    }
}
