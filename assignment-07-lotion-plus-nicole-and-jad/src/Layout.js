import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import NoteList from "./NoteList";
import { v4 as uuidv4 } from "uuid";
import { currentDate } from "./utils";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const localStorageKey = "lotion-v1";

function Layout() {
  const navigate = useNavigate();
  const mainContainerRef = useRef(null);
  const [collapse, setCollapse] = useState(false);
  const [notes, setNotes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState(-1);

  //for login page
  const [user, setUser] = useState([]);
  const [profile, setProfile] = useState([]);

  useEffect(() => {
    //const height = mainContainerRef.current.offsetHeight;
    //mainContainerRef.current.style.maxHeight = `${height}px`;
    const existing = localStorage.getItem(localStorageKey);
    if (existing) {
      try {
        setNotes(JSON.parse(existing));
      } catch {
        setNotes([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (currentNote < 0) {
      return;
    }
    if (!editMode) {
      navigate(`/notes/${currentNote + 1}`);
      return;
    }
    navigate(`/notes/${currentNote + 1}/edit`);
  }, [notes]);

  // useEffect(() => {
  //   const asyncEffect = async () => {
  //     if (user.length != 0) {
  //       const promise = await fetch(
  //         `https://4pismha4etrdoczsnjn467o6xm0bzlme.lambda-url.ca-central-1.on.aws?email=${user}`
  //       );
  //       const notes = await promise.json();
  //       setNotes(notes);
  //     }
  //   };
  //   asyncEffect();
  // }, [user]);

  const saveNote = async (note, index) => {
    note.body = note.body.replaceAll("<p><br></p>", "");
    setNotes([
      ...notes.slice(0, index),
      { ...note },
      ...notes.slice(index + 1),
    ]);
    setCurrentNote(index);
    setEditMode(false);

    console.log({ ...note, profile });
    const res = await fetch(
      "https://yvrjatipmc652ugxnx36pjxc4y0aqmnr.lambda-url.ca-central-1.on.aws/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...note, email: profile.email }),
        //body: JSON.stringify({ ...note, profile }),
      }
    );

    const jsonRes = await res.json();
  };

  const deleteNote = async (index) => {
    setNotes([...notes.slice(0, index), ...notes.slice(index + 1)]);
    setCurrentNote(0);
    setEditMode(false);

    const res = await fetch(
      `https://ydmjuj2kwwkxfweii5d7425ybe0ztstc.lambda-url.ca-central-1.on.aws?email=${profile.email}&id=${index}`,
      {
        method: "DELETE",
      }
    );

    if (res.status === 200) {
      setNotes(notes.filter((note) => note.id !== index));
    }
  };

  const addNote = () => {
    setNotes([
      {
        id: uuidv4(),
        title: "Untitled",
        body: "",
        when: currentDate(),
      },
      ...notes,
    ]);
    setEditMode(true);
    setCurrentNote(0);
  };
  const responseMessage = (response) => {
    console.log(response);
  };
  const errorMessage = (error) => {
    console.log(error);
  };

  useEffect(() => {
    console.log("profile: ", profile);
    getNotes(profile);
  }, [profile]);

  const getNotes = async (profile) => {
    const email = profile.email;
    console.log("email:", email);
    console.log(user.access_token);
    const res = await fetch(
      `https://4pismha4etrdoczsnjn467o6xm0bzlme.lambda-url.ca-central-1.on.aws?email=${email}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          Accept: "application/json",
          access_token: user.access_token,
        },
      }
    );

    const jsonRes = await res.json();
    setNotes(jsonRes);
  };

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log("Login Failed:", error),
  });

  useEffect(() => {
    if (user) {
      axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${user.access_token}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  // log out function to log the user out of google and set the profile array to null
  const logOut = () => {
    googleLogout();
    setProfile([]);
    setUser([]);
  };

  return (
    <div id="container">
      {user.length == 0 ? (
        <>
          <header>
            <aside>
              <button id="menu-button" onClick={() => setCollapse(!collapse)}>
                &#9776;
              </button>
            </aside>
            <div id="app-header">
              <h1>
                <Link to="/notes">Lotion</Link>
              </h1>
              <h6 id="app-moto">Like Notion, but worse.</h6>
            </div>
            <aside>&nbsp;</aside>
          </header>

          <div id="google-sign-in">
            <button
              id="google-button"
              onClick={() => {
                setNotes(notes);
                login();
              }}
            >
              Sign in with Google 🚀{" "}
            </button>
          </div>
        </>
      ) : (
        <>
          <header>
            <aside>
              <button id="menu-button" onClick={() => setCollapse(!collapse)}>
                &#9776;
              </button>
            </aside>
            <div id="app-header">
              <h1>
                <Link to="/notes">Lotion</Link>
              </h1>
              <h6 id="app-moto">Like Notion, but worse.</h6>
            </div>
            <div className="userInfo">
              <p id="email">{profile.email}</p>
              <button id="logout" onClick={() => logOut()}>
                (log out)
              </button>
            </div>
          </header>

          <div id="main-container" ref={mainContainerRef}>
            <aside id="sidebar" className={collapse ? "hidden" : null}>
              <header>
                <div id="notes-list-heading">
                  <h2>Notes</h2>
                  <button id="new-note-button" onClick={addNote}>
                    +
                  </button>
                </div>
              </header>
              <div id="notes-holder">
                <NoteList notes={notes} />
              </div>
            </aside>
            <div id="write-box">
              <Outlet context={[notes, saveNote, deleteNote]} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Layout;
