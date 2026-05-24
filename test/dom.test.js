// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { $, coerceData } from "../src/content/dom.js";

describe("$ selection", () => {
  it("selects, indexes array-like, and reports length", () => {
    document.body.innerHTML = `<div id="a" class="box"></div><div class="box"></div>`;
    expect($(".box").length).toBe(2);
    expect($("#a")[0]).toBe(document.getElementById("a"));
    expect($(".missing").length).toBe(0);
  });

  it("iterates with jQuery (index, element) semantics", () => {
    document.body.innerHTML = `<i id="a"></i><i id="b"></i>`;
    const seen = [];
    $("i").each(function (idx) {
      seen.push(idx + ":" + this.id);
    });
    expect(seen).toEqual(["0:a", "1:b"]);
    expect(
      $("i")
        .map(function () {
          return this.id;
        })
        .get()
    ).toEqual(["a", "b"]);
  });
});

describe("$ classes / attrs / props", () => {
  it("adds, toggles (with state), and tests classes", () => {
    document.body.innerHTML = `<div id="a"></div>`;
    $("#a").addClass("x y").toggleClass("z", true).toggleClass("y");
    expect($("#a").hasClass("x")).toBe(true);
    expect($("#a").hasClass("z")).toBe(true);
    expect($("#a").hasClass("y")).toBe(false);
  });

  it("gets/sets attr, removeAttr, and prop", () => {
    document.body.innerHTML = `<input id="i"><input id="c" type="checkbox">`;
    $("#i").attr("placeholder", "hi");
    expect($("#i").attr("placeholder")).toBe("hi");
    $("#i").removeAttr("placeholder");
    expect($("#i").attr("placeholder")).toBe(null);
    $("#c").prop("checked", true);
    expect($("#c").prop("checked")).toBe(true);
  });
});

describe("coerceData / .data()", () => {
  it("coerces data-* values the way jQuery does", () => {
    expect(coerceData("123456789012")).toBe(123456789012);
    expect(coerceData("true")).toBe(true);
    expect(coerceData("false")).toBe(false);
    expect(coerceData("arn:aws:iam::x")).toBe("arn:aws:iam::x");
    expect(coerceData(null)).toBe(undefined);
  });

  it("reads data-* attributes through .data()", () => {
    document.body.innerHTML = `<button data-role-arn="arn:x" data-num="42"></button>`;
    expect($("button").data("role-arn")).toBe("arn:x");
    expect($("button").data("num")).toBe(42);
  });
});

describe("$ content", () => {
  it("gets/sets val, escapes text, and sets html markup", () => {
    document.body.innerHTML = `<input id="i"><span id="s"></span>`;
    $("#i").val("hello");
    expect($("#i").val()).toBe("hello");
    $("#s").text("<b>x</b>");
    expect($("#s")[0].textContent).toBe("<b>x</b>");
    expect($("#s")[0].querySelector("b")).toBe(null);
    $("#s").html("<b>x</b>");
    expect($("#s")[0].querySelector("b")).not.toBe(null);
  });
});

describe("$ insertion", () => {
  it("appends strings and arrays of HTML, prepends in order, appendTo, before", () => {
    document.body.innerHTML = `<ul id="list"></ul>`;
    $("#list").append("<li class='item'>1</li>");
    $("#list").append(["<li class='item'>2</li>", "<li class='item'>3</li>"]);
    $("#list").prepend("<li class='item'>0</li>");
    expect($("#list .item").length).toBe(4);
    expect($("#list").children()[0].textContent).toBe("0");

    const created = $("<input type='hidden' name='r'>").appendTo($("#list"));
    expect(created.attr("name")).toBe("r");
    expect($("#list input[name=r]").length).toBe(1);

    $("#list .item").first().before("<li class='pre'>P</li>");
    expect($("#list li")[0].className).toBe("pre");
  });
});

describe("$ traversal", () => {
  it("finds closest, filters (fn/sel), not, children().not().first(), prevAll().first()", () => {
    document.body.innerHTML = `<div id="c"><span class="t" data-v="1"></span><span class="t" data-v="2"></span><a class="x"></a></div>`;
    expect($(".t").eq(1).closest("#c")[0]).toBe(document.getElementById("c"));
    expect(
      $(".t").filter(function () {
        return this.dataset.v === "2";
      }).length
    ).toBe(1);
    expect($("#c span,#c a").filter(".t").length).toBe(2);
    expect($("#c span,#c a").not(".t").length).toBe(1);
    expect($("#c").children().not(".t").first()[0].tagName).toBe("A");
    expect($(".x").prevAll(".t").first().data("v")).toBe(2);
  });
});

describe("$ css / show / hide", () => {
  it("show() does not clobber an explicit display, hide() sets none", () => {
    document.body.innerHTML = `<div id="m"></div>`;
    $("#m").css("display", "flex").show();
    expect($("#m")[0].style.display).toBe("flex");
    expect($("#m").css("display")).toBe("flex");
    $("#m").css("display", "none").hide();
    expect($("#m")[0].style.display).toBe("none");
  });
});

describe("$ events", () => {
  it("delegates with this=matched element and honors `return false`", () => {
    document.body.innerHTML = `<div id="root"><button class="btn"><i class="ic"></i></button></div>`;
    let clicked = null;
    $("#root").on("click", ".btn", function () {
      clicked = this.className;
      return false;
    });
    const evt = new MouseEvent("click", { bubbles: true, cancelable: true });
    const notPrevented = $("#root .ic")[0].dispatchEvent(evt);
    expect(clicked).toBe("btn");
    expect(notPrevented).toBe(false); // return false -> preventDefault
  });

  it("triggers a direct input handler and forwards $.Event modifier keys", () => {
    document.body.innerHTML = `<input id="q"><div id="r"><button class="b"></button></div>`;
    let typed = 0;
    $("#q").on("input", () => {
      typed++;
    });
    $("#q").trigger("input");
    expect(typed).toBe(1);

    let meta = null;
    $("#r").on("click", ".b", (e) => {
      meta = e.metaKey;
    });
    $("#r .b").trigger($.Event("click", { metaKey: true }));
    expect(meta).toBe(true);
  });
});

describe("$ removal / effects", () => {
  it("empties, removes, and fires the fadeOut callback", async () => {
    document.body.innerHTML = `<div id="g"><b></b><b></b></div><div id="r"></div>`;
    $("#g").empty();
    expect($("#g")[0].children.length).toBe(0);
    $("#r").remove();
    expect(document.getElementById("r")).toBe(null);
    await new Promise((resolve) => $("#g").fadeOut(5, resolve));
    expect(true).toBe(true);
  });
});
