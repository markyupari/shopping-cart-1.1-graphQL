import { useState, useEffect, useReducer } from "react";
import Card from "react-bootstrap/Card";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import { useAccordionButton } from "react-bootstrap/esm/AccordionButton";
import axios from "axios";
import { useQuery, gql } from "@apollo/client";

// query for products
const PRODUCTS = gql`
  query GetProducts {
    products {
      data {
        id
        attributes {
          Name
          Country
          Cost
          Instock
        }
      }
    }
  }
`;

// simulate getting products from DataBase
const products = [
  { name: "Apples_:", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges:", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans__:", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage:", country: "USA", cost: 1, instock: 8 },
];

//=========CART===============//
const Cart = (props) => {
  let data = props.location.data ? props.location.data : products;
  console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

//Query products through GraphQL
const useQueryApi = () => {
  const [url, setUrl] = useState("");
  // const [isLoading, setIsLoading] = useState(false);
  // const [isError, setIsError] = useState(false);
  // const [queryData, setQueryData] = useState([]);

  const { loading, error, data } = useQuery(PRODUCTS);
  // setIsLoading(loading);
  // setIsError(error);
  // setIsData(data);
  console.log("useQueryApi has been called");
  if (loading) console.log("loading...");
  if (error) console.log(`Error: ${error.message}`);
  return [{ data, loading, error }, setUrl];
};

const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log("useDataApi has been called");
  useEffect(() => {
    console.log("useEffect has been called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URL");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

function App() {
  const [items, setItems] = useState(products);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  // //fetch data
  const [query, setQuery] = useState("API/products");
  const [{ data, loading, error }, doFetch] = useQueryApi();
  console.log(`Rendering Products ${JSON.stringify(data)}`);

  //Fetch data
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name === name);
    if (item[0].instock === 0) return;
    console.log(`add to Cart ${JSON.stringify(item)}`);
    setCart([...cart, ...item]); //adds filtered by name item to the cart
    let newItems = items.map((element, index) => {
      if (element.name === item[0].name) element.instock = element.instock - 1;
      return element;
    });
    setItems(newItems);
    //doFetch(query);
  };
  const deleteCartItem = (index) => {
    let newCart = cart.filter((item, i) => index != i);
    let target = cart.filter((item, i) => index === i);
    let newItems = items.map((item, i) => {
      if (item.name === target[0].name) item.instock = item.instock + 1;
      return item;
    });
    setCart(newCart); //sets Cart to items with different id from the one selected
    setItems(newItems);
  };
  const photos = ["apple.png", "orange.png", "beans.png", "cabbage.png"];

  let list = items.map((item, index) => {
    let n = Math.floor(Math.random() * 20) + 1049;
    let url = "https://picsum.photos/id/" + n + "/50/50";

    return (
      <li key={index}>
        <Image src={url} width={70} roundedCircle></Image>
        <Button variant="primary" size="larg">
          {item.name} ${item.cost} Stock:{item.instock}
        </Button>
        <input name={item.name} type="submit" onClick={addToCart}></input>
      </li>
    );
  });

  function CustomToggle({ children, eventKey }) {
    const decoratedOnClick = useAccordionButton(eventKey, () => {
      console.log("custom toggle activated");
    });
    return (
      <Button type="button" variant="primary" onClick={decoratedOnClick}>
        {children}
      </Button>
    );
  }

  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <CustomToggle eventKey={1 + index}>{item.name}</CustomToggle>
        </Card.Header>
        <Accordion.Collapse
          onClick={() => deleteCartItem(index)}
          eventKey={1 + index}
        >
          <Card.Body>
            $ {item.cost} from {item.country}
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  //Calculates the total checkout by adding the cost of each item
  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };

  //Restock products through a query to the server(strapi)
  const restockProducts = (url) => {
    // doFetch(url);

    let newItems = data.products.data.map((item) => {
      let { Name, Country, Cost, Instock } = item.attributes;
      let name = Name;
      let country = Country;
      let cost = Cost;
      let instock = Instock;
      return { name, country, cost, instock };
    });
    setItems([...items, ...newItems]);
    console.log(newItems);
  };

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut</h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            restockProducts(`http://localhost:1337/${query}`);
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Restock Products</button>
        </form>
      </Row>
    </Container>
  );
}

export default App;
