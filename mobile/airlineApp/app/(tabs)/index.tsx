import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";

import { searchFlights } from "../../services/api";
import { AIRLINE_NAMES } from "../../constants/airlines";

type SortMode = "cheapest" | "fastest" | "earliest";

export default function IndexScreen() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");

  const [departDate, setDepartDate] = useState<Date>(new Date());
  const [showDepartPicker, setShowDepartPicker] = useState(false);

  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  const [nonStop, setNonStop] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [activeSort, setActiveSort] = useState<SortMode>("cheapest");

  // Booking / ticket state
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [passengerName, setPassengerName] = useState("Utkarsh Kumawat");
  const [pnr, setPnr] = useState("");

  // --------- helpers ----------

  const getDurationMinutes = (itinerary: any) => {
    const start = new Date(itinerary.segments[0].departure.at);
    const end = new Date(
      itinerary.segments[itinerary.segments.length - 1].arrival.at
    );
    return (end.getTime() - start.getTime()) / 60000;
  };

  const sortFlights = (offers: any[]): any[] => {
    if (!offers?.length) return [];
    if (activeSort === "cheapest") {
      return [...offers].sort(
        (a, b) =>
          Number(a.price.total_in_inr || a.price.total || 0) -
          Number(b.price.total_in_inr || b.price.total || 0)
      );
    }
    if (activeSort === "fastest") {
      return [...offers].sort(
        (a, b) =>
          getDurationMinutes(a.itineraries[0]) -
          getDurationMinutes(b.itineraries[0])
      );
    }
    if (activeSort === "earliest") {
      return [...offers].sort((a, b) => {
        const ta = a.itineraries[0].segments[0].departure.at;
        const tb = b.itineraries[0].segments[0].departure.at;
        return ta > tb ? 1 : -1;
      });
    }
    return offers;
  };

  const airlineName = (code?: string) => {
    if (!code) return "Unknown Airline";
    return AIRLINE_NAMES[code] || code;
  };

  const randomPNR = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };

  // --------- API call ----------

  const handleSearch = async () => {
    try {
      if (!origin || !destination) {
        alert("Please enter origin and destination airport codes (e.g. DEL, BOM)");
        return;
      }

      console.log("🔍 Searching Flights...");

      const data = await searchFlights({
        origin,
        destination,
        departDate: departDate.toISOString().slice(0, 10),
        returnDate: returnDate ? returnDate.toISOString().slice(0, 10) : undefined,
        nonStop,
      });

      console.log("📥 Backend Response:", data);
      setResults(sortFlights(data));
    } catch (e: any) {
      console.log("❌ Search error:", e);
      alert("Search failed: " + (e.message || "Unknown error"));
    }
  };

  // --------- Booking / Ticket ----------

  const openTicket = (offer: any) => {
    setSelectedOffer(offer);
    setPnr(randomPNR());
    setShowTicketModal(true);
  };

  const handleGeneratePdf = async () => {
    if (!selectedOffer) return;

    const it = selectedOffer.itineraries[0];
    const firstSeg = it.segments[0];
    const lastSeg = it.segments[it.segments.length - 1];

    const airlineCode = selectedOffer.validatingAirlineCodes?.[0];
    const airline = airlineName(airlineCode);

    const depTime = firstSeg.departure.at.slice(0, 16).replace("T", " ");
    const arrTime = lastSeg.arrival.at.slice(0, 16).replace("T", " ");
    const price = selectedOffer.price.total_in_inr || selectedOffer.price.total;

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 24px;
              background: #f4f6fb;
            }
            .ticket {
              background: #ffffff;
              border-radius: 16px;
              padding: 20px;
              border: 1px solid #e0e0e0;
            }
            .title {
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .subtitle {
              color: #777;
              margin-bottom: 16px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
            }
            .label {
              font-size: 13px;
              color: #999;
            }
            .value {
              font-size: 16px;
              font-weight: 600;
            }
            .price {
              font-size: 20px;
              font-weight: 700;
              color: #10b981;
              margin-top: 12px;
            }
            .footer {
              margin-top: 24px;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="title">${airline} – E-Ticket</div>
            <div class="subtitle">PNR: ${pnr}</div>

            <div class="row">
              <div>
                <div class="label">Passenger</div>
                <div class="value">${passengerName}</div>
              </div>
              <div>
                <div class="label">Class</div>
                <div class="value">Economy</div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="label">From</div>
                <div class="value">${origin}</div>
              </div>
              <div>
                <div class="label">To</div>
                <div class="value">${destination}</div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="label">Departure</div>
                <div class="value">${depTime}</div>
              </div>
              <div>
                <div class="label">Arrival</div>
                <div class="value">${arrTime}</div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="label">Stops</div>
                <div class="value">${it.segments.length - 1}</div>
              </div>
              <div>
                <div class="label">Airline Code</div>
                <div class="value">${airlineCode || "-"}</div>
              </div>
            </div>

            <div class="price">₹ ${price}</div>

            <div class="footer">
              This is a dummy ticket generated for demo purposes only.
            </div>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Share your ticket",
    });
  };

  // --------- UI ----------

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>✈️ Mavericks</Text>
<Text style={styles.subHeading}>Smart Flight Booking</Text>

        {/* Search Card */}
        <View style={styles.searchCard}>
          <TextInput
            style={styles.input}
            placeholder="From (e.g. DEL)"
            placeholderTextColor="#9ca3af"
            value={origin}
            onChangeText={setOrigin}
          />

          <TextInput
            style={styles.input}
            placeholder="To (e.g. BOM)"
            placeholderTextColor="#9ca3af"
            value={destination}
            onChangeText={setDestination}
          />

          {/* Departure Date */}
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDepartPicker(true)}
          >
            <Text style={styles.dateLabel}>Departure date</Text>
            <Text style={styles.dateValue}>
              {departDate.toISOString().slice(0, 10)}
            </Text>
          </TouchableOpacity>

          {/* Return Date */}
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowReturnPicker(true)}
          >
            <Text style={styles.dateLabel}>Return date (optional)</Text>
            <Text style={styles.dateValue}>
              {returnDate ? returnDate.toISOString().slice(0, 10) : "—"}
            </Text>
          </TouchableOpacity>

          {/* Date pickers */}
          {showDepartPicker && (
            <DateTimePicker
              value={departDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDepartPicker(false);
                if (date) setDepartDate(date);
              }}
            />
          )}
          {showReturnPicker && (
            <DateTimePicker
              value={returnDate || departDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowReturnPicker(false);
                if (date) setReturnDate(date);
              }}
            />
          )}

          {/* Non-stop switch */}
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Non-stop only</Text>
            <Switch value={nonStop} onValueChange={setNonStop} />
          </View>

          {/* Passenger name (for ticket) */}
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder="Passenger name (for ticket)"
            placeholderTextColor="#9ca3af"
            value={passengerName}
            onChangeText={setPassengerName}
          />

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchText}>Search Flights</Text>
          </TouchableOpacity>
        </View>

        {/* Sort tabs */}
        <View style={styles.sortRow}>
          {(["cheapest", "fastest", "earliest"] as SortMode[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                setActiveSort(s);
                setResults(sortFlights(results));
              }}
            >
              <Text
                style={[
                  styles.sortText,
                  activeSort === s && styles.sortActive,
                ]}
              >
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Results */}
        {results.map((offer, index) => {
          const it = offer.itineraries[0];
          const firstSeg = it.segments[0];
          const lastSeg = it.segments[it.segments.length - 1];

          const airlineCode = offer.validatingAirlineCodes?.[0];
          const airline = airlineName(airlineCode);
          const price = offer.price.total_in_inr || offer.price.total;

          const depTime = firstSeg.departure.at.slice(11, 16);
          const arrTime = lastSeg.arrival.at.slice(11, 16);

          return (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardAirline}>{airline}</Text>
                <Text style={styles.cardPrice}>₹ {price}</Text>
              </View>

              <Text style={styles.cardRoute}>
                {origin} → {destination}
              </Text>

              <Text style={styles.cardTime}>
                {depTime} — {arrTime} · {it.segments.length - 1} stops
              </Text>

              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => openTicket(offer)}
              >
                <Text style={styles.bookText}>Book & Generate Ticket</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {results.length === 0 && (
          <Text style={styles.emptyText}>
            Start by searching for any route like DEL → BOM.
          </Text>
        )}
      </ScrollView>

      {/* Ticket modal */}
      <Modal
        visible={showTicketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTicketModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedOffer && (
              <>
                <Text style={styles.modalTitle}>Dummy Ticket Preview</Text>
                <Text style={styles.modalPnr}>PNR: {pnr}</Text>

                <Text style={styles.modalLine}>
                  Passenger: <Text style={styles.bold}>{passengerName}</Text>
                </Text>
                <Text style={styles.modalLine}>
                  Route:{" "}
                  <Text style={styles.bold}>
                    {origin} → {destination}
                  </Text>
                </Text>

                <Text style={styles.modalLine}>
                  Airline:{" "}
                  <Text style={styles.bold}>
                    {airlineName(
                      selectedOffer.validatingAirlineCodes?.[0]
                    )}
                  </Text>
                </Text>

                <View style={{ height: 16 }} />

                <TouchableOpacity
                  style={styles.pdfBtn}
                  onPress={handleGeneratePdf}
                >
                  <Text style={styles.pdfText}>Download PDF Ticket</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowTicketModal(false)}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
  },
  subHeading: {
  fontSize: 16,
  color: "#666",
  marginBottom: 20,
},

  searchCard: {
    backgroundColor: "#020617",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
    color: "white",
    marginBottom: 10,
    fontSize: 15,
  },
  dateInput: {
    backgroundColor: "#020617",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
    marginBottom: 10,
  },
  dateLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  dateValue: {
    color: "white",
    fontSize: 15,
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 14,
  },
  searchText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  sortText: {
    color: "#9ca3af",
    paddingBottom: 4,
    fontSize: 14,
  },
  sortActive: {
    color: "#38bdf8",
    borderBottomWidth: 2,
    borderBottomColor: "#38bdf8",
  },
  card: {
    backgroundColor: "#020617",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardAirline: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  cardPrice: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "700",
  },
  cardRoute: {
    marginTop: 6,
    color: "#e5e7eb",
  },
  cardTime: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 13,
  },
  cardStops: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 13,
  },
  bookBtn: {
    marginTop: 10,
    backgroundColor: "#38bdf8",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  bookText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#020617",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalPnr: {
    color: "#38bdf8",
    marginBottom: 12,
    fontWeight: "600",
  },
  modalLine: {
    color: "#e5e7eb",
    marginTop: 4,
  },
  bold: {
    fontWeight: "700",
  },
  pdfBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 18,
  },
  pdfText: {
    color: "#022c22",
    fontWeight: "700",
  },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeText: {
    color: "#9ca3af",
  },
});
